import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field'; // Corrigido
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService} from '../auth.service';

// Three.js
import * as THREE from 'three';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss' // Usando SCSS para aninhamento
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private fb = inject(FormBuilder);
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  hidePassword = signal(true);

  // Instâncias Three.js
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private particlesMesh!: THREE.Points;
  private animationFrameId!: number;
  private count = 0; // Para a animação da onda

  // Interação do mouse
  private mouseX = 0;
  private mouseY = 0;
  private targetX = 0;
  private targetY = 0;
  private windowHalfX = window.innerWidth / 2;
  private windowHalfY = window.innerHeight / 2;

  // Configurações da onda de partículas
  private readonly SEPARATION = 40;
  private readonly AMOUNTX = 100;
  private readonly AMOUNTY = 100;

  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);


  ngAfterViewInit(): void {
    this.initThree();
    this.animate();

    // Listeners de evento
    window.addEventListener('resize', this.onWindowResize.bind(this));
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    document.removeEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    this.renderer?.dispose();
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;

    // 1. Cena
    this.scene = new THREE.Scene();
    // Neblina para dar profundidade
    this.scene.fog = new THREE.FogExp2(0x0a0b10, 0.0012);

    // 2. Câmera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.z = 1000;
    this.camera.position.y = 400; // Olhando de cima
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // 3. Geometria da Onda de Partículas
    const numParticles = this.AMOUNTX * this.AMOUNTY;
    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles); // Escalas individuais para variação

    let i = 0, j = 0;
    for (let ix = 0; ix < this.AMOUNTX; ix++) {
      for (let iy = 0; iy < this.AMOUNTY; iy++) {
        positions[i] = ix * this.SEPARATION - ((this.AMOUNTX * this.SEPARATION) / 2); // x
        positions[i + 1] = 0; // y (inicialmente plano)
        positions[i + 2] = iy * this.SEPARATION - ((this.AMOUNTY * this.SEPARATION) / 2); // z
        scales[j] = 1;
        i += 3; j++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Material de Partículas Avançado
    const material = new THREE.PointsMaterial({
      size: 8,
      color: 0x8e44ad, // Roxo vibrante (combina com o Magenta/Violet do Material)
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending, // Brilho intenso onde se sobrepõem
      depthTest: false // Evita artefatos visuais
    });

    this.particlesMesh = new THREE.Points(geometry, material);
    this.scene.add(this.particlesMesh);

    // 4. Renderizador
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.render();
  }

  private render(): void {
    // 1. Movimento Suave da Câmera pelo Mouse (Parallax)
    this.targetX = this.mouseX * 0.05; // Fator de sensibilidade
    this.targetY = this.mouseY * 0.02;

    this.camera.position.x += (this.targetX - this.camera.position.x) * 0.02; // Amortecimento
    this.camera.position.y += (-this.targetY + 400 - this.camera.position.y) * 0.02;
    this.camera.lookAt(this.scene.position);

    // 2. Animação da Onda de Partículas (Matemática)
    const positions = this.particlesMesh.geometry.attributes['position'].array as Float32Array;
    const scales = this.particlesMesh.geometry.attributes['scale'].array as Float32Array;

    let i = 0, j = 0;
    for (let ix = 0; ix < this.AMOUNTX; ix++) {
      for (let iy = 0; iy < this.AMOUNTY; iy++) {
        // Onda Senoidal Complexa
        positions[i + 1] = (Math.sin((ix + this.count) * 0.3) * 100) +
          (Math.sin((iy + this.count) * 0.5) * 100);

        // Variação de Escala baseada na altura
        scales[j] = (Math.sin((ix + this.count) * 0.3) + 1) * 10 +
          (Math.sin((iy + this.count) * 0.5) + 1) * 10;

        i += 3; j++;
      }
    }

    this.particlesMesh.geometry.attributes['position'].needsUpdate = true;
    this.particlesMesh.geometry.attributes['scale'].needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
    this.count += 0.02; // Velocidade da onda
  }

  private onDocumentMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX - this.windowHalfX;
    this.mouseY = event.clientY - this.windowHalfY;
  }

  private onWindowResize(): void {
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  togglePassword(event: MouseEvent): void {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Chama o serviço de Login
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);

        // Redireciona o usuário para a página principal / dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Exibe mensagem de erro da API ou padrão
        this.errorMessage.set(err.error?.message || 'E-mail ou senha inválidos.');
      }
    });
  }


}
