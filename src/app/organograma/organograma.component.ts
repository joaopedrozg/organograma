import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgChart } from 'd3-org-chart';
import { OrganogramaService } from './organograma.service';
import { MatIconModule} from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FuncionarioModalComponent } from '../components/funcionario-modal/funcionario-modal.component';
import { MatButtonModule } from '@angular/material/button';
import { Funcionario } from '../models/models';

export interface NodeOrganograma {
  id: string;
  parentId?: string | null;
  name: string;
  cargo: string;
  departamento: string;
  imagem?: string;
}

const ORGANOGRAM_ROOT_ID = '__organograma_root__';

@Component({
  selector: 'app-organograma',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule, MatButtonModule],
  templateUrl: './organograma.component.html',
  styleUrl: './organograma.component.scss'
})
export class OrganogramaComponent implements OnInit, AfterViewInit {
  // Referência ao elemento div do HTML onde o gráfico será desenhado
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  private organogramaService = inject(OrganogramaService);
  private dialog = inject(MatDialog);

  chart: OrgChart<NodeOrganograma> | null = null;
  listaDados: NodeOrganograma[] = [];
  carregando : boolean = true;

  ngOnInit(): void {
    this.carregarDados();
  }

  ngAfterViewInit(): void {
    // Se os dados já tiverem sido carregados antes do view carregar
    if (this.listaDados.length > 0) {
      this.renderizarOrganograma();
    }
  }

  carregarDados(): void {
    this.organogramaService.obterDados().subscribe({
      next: (dados) => {
        const mappedData = dados.map((f: Funcionario) => ({
          id: String(f.id ?? ''),
          parentId: f.parentId != null ? String(f.parentId) : null,
          name: f.name,
          cargo: typeof f.cargo === 'string' ? f.cargo : f.cargo?.nome || '',
          departamento: typeof f.departamento === 'string' ? f.departamento : f.departamento?.nome || '',
          imagem: f.imagem
        }));

        const roots = mappedData.filter(node => !node.parentId);
        this.listaDados = roots.length > 1
          ? [
              {
                id: ORGANOGRAM_ROOT_ID,
                parentId: null,
                name: 'Organização',
                cargo: '',
                departamento: '',
                imagem: undefined
              },
              ...mappedData.map(node => ({
                ...node,
                parentId: node.parentId || ORGANOGRAM_ROOT_ID
              }))
            ]
          : mappedData;
        this.carregando = false;

        // Garante que o container HTML já existe na DOM antes de renderizar
        setTimeout(() => this.renderizarOrganograma(), 0);
      },
      error: (err) => {
        console.error('Erro ao carregar organograma:', err);
        this.carregando = false;
      }
    });
  }

  renderizarOrganograma(): void {
    if (!this.chartContainer || !this.listaDados.length) return;

    if (!this.chart) {
      this.chart = new OrgChart<NodeOrganograma>();
    }

    this.chart
      .container(this.chartContainer.nativeElement)
      .data(this.listaDados)
      .nodeId((data: NodeOrganograma) => data.id)
      .parentNodeId((data: NodeOrganograma) => data.parentId || '')
      .nodeWidth(() => 240)
      .nodeHeight(() => 100)
      .compactMarginBetween(() => 35)
      .compactMarginPair(() => 45)
      .childrenMargin(() => 60)
      .siblingsMargin(() => 40)

      // =========================================================
      // ⬇️ ESTILIZAÇÃO DAS LINHAS DE RELACIONAMENTO ⬇️
      // =========================================================
      .linkUpdate((d: any, i: number, arr: any[]) => {
        // 'd3.select(arr[i])' seleciona o caminho (path) SVG do conector
        const link = arr[i];
        if (link) {
          link.setAttribute('stroke', '#2563eb');     // Cor da linha (Ex: Azul moderno)
          link.setAttribute('stroke-width', '1');     // Espessura da linha em pixels (Ex: 3px)
          link.setAttribute('stroke-dasharray', 'none'); // Garante que a linha seja contínua
        }
      })
      // =========================================================

      .nodeContent((node: any) => {
        if (node.data.id === ORGANOGRAM_ROOT_ID) {
          return `
          <div style="
            background: linear-gradient(135deg, rgba(15,188,249,0.14), rgba(142,68,173,0.14));
            border: 1px solid rgba(15,188,249,0.35);
            border-radius: 14px;
            padding: 14px 18px;
            color: #fff;
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            box-sizing: border-box;
            font-weight: 700;
            letter-spacing: 0.4px;
          ">Organização</div>
        `;
        }

        return `
        <div style="
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.08);
          font-family: sans-serif;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <img
            src="${node.data.imagem || 'https://via.placeholder.com/40'}"
            style="border-radius: 50%; width: 44px; height: 44px; object-fit: cover; flex-shrink: 0;"
          />
          <div style="overflow: hidden; flex-grow: 1;">
            <div style="font-weight: bold; font-size: 14px; color: #333; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
              ${node.data.name}
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 3px; line-height: 1.2;">
              ${node.data.cargo}
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 3px; line-height: 1.2;">
              ${node.data.departamento}
            </div>
          </div>
        </div>
      `;
      })
      .render();
  }

  isCollapsed = false;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;

    // Dispara um resize para ajustar o organograma caso ele precise recalcular o tamanho
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  abrirModalFuncionarios(): void {
    this.dialog.open(FuncionarioModalComponent, {
      width: '1200px',
      height: '90vh',
      maxWidth: '95vw',
      panelClass: 'premium-modal'
    }).afterClosed().subscribe(() => {
      this.carregarDados(); // Recarregar organograma se houver mudanças
    });
  }
}
