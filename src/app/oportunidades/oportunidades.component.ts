import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, CurrencyPipe } from '@angular/common';

import {
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    CdkDragDrop
} from '@angular/cdk/drag-drop';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/app-component-base';

import {
    OportunidadesServiceProxy,
    OportunidadeKanbanDto,
    AlterarStatusOportunidadeDto
} from '@shared/service-proxies/service-proxies';

import { BsModalService } from 'ngx-bootstrap/modal';

import { StatusNegociacaoDialogComponent } from './status-negociacao/status-negociacao-dialog.component';
import { CreateOportunidadeDialogComponent } from './create-oportunidade/create-oportunidade-dialog.component';


@Component({
    animations: [appModuleAnimation()],
    templateUrl: './oportunidades.component.html',
    styleUrls: ['./oportunidades.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        NgClass,
        CurrencyPipe,

        CdkDrag,
        CdkDropList,
        CdkDropListGroup
    ]
})
export class OportunidadesComponent extends AppComponentBase implements OnInit {

    kanban: OportunidadeKanbanDto[] = [];

    keyword = '';

    carregando = false;
    arrastando = false;

    totalOportunidades = 0;
    valorTotal = 0;

    oportunidadeMovendo = false;


    constructor(
        injector: Injector,
        private _oportunidadesService: OportunidadesServiceProxy,
        private _modalService: BsModalService,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }


    ngOnInit(): void {
        this.carregarKanban();
    }


    carregarKanban(): void {

        this.carregando = true;

        this._oportunidadesService
            .getKanban(
                undefined,
                undefined,
                this.keyword || undefined
            )
            .subscribe({

                next: (result) => {

                    this.kanban = result || [];

                    this.calcularTotais();

                    this.carregando = false;

                    this.cd.detectChanges();
                },

                error: () => {

                    this.carregando = false;

                    this.cd.detectChanges();
                }

            });
    }


    pesquisar(): void {
        this.carregarKanban();
    }


    limparPesquisa(): void {

        this.keyword = '';

        this.carregarKanban();
    }


    calcularTotais(): void {

        this.totalOportunidades = 0;
        this.valorTotal = 0;

        this.kanban.forEach((coluna) => {

            this.totalOportunidades += coluna.quantidade || 0;

            if (coluna.oportunidades) {

                coluna.oportunidades.forEach((oportunidade) => {

                    this.valorTotal += oportunidade.valorEstimado || 0;

                });
            }
        });
    }


    getValorColuna(coluna: OportunidadeKanbanDto): number {

        if (!coluna.oportunidades) {
            return 0;
        }

        return coluna.oportunidades.reduce(
            (total, oportunidade) =>
                total + (oportunidade.valorEstimado || 0),
            0
        );
    }


    getProbabilidadeClass(
        probabilidade: number | undefined
    ): string {

        if (
            probabilidade === undefined ||
            probabilidade === null
        ) {
            return 'probabilidade-media';
        }

        if (probabilidade >= 70) {
            return 'probabilidade-alta';
        }

        if (probabilidade >= 40) {
            return 'probabilidade-media';
        }

        return 'probabilidade-baixa';
    }


    novaOportunidade(): void {

        const modal = this._modalService.show(
            CreateOportunidadeDialogComponent,
            {
                class: 'modal-lg'
            }
        );

        modal.content!.onSave.subscribe(() => {

            this.carregarKanban();

        });
    }


    gerenciarStatus(): void {

        const modal = this._modalService.show(
            StatusNegociacaoDialogComponent,
            {
                class: 'modal-lg'
            }
        );

        modal.content!.onSave.subscribe(() => {

            this.carregarKanban();

        });
    }


    abrirOportunidade(oportunidadeId: string): void {

        const modal = this._modalService.show(
            CreateOportunidadeDialogComponent,
            {
                class: 'modal-lg',

                initialState: {
                    oportunidadeId: oportunidadeId
                }
            }
        );

        modal.content!.onSave.subscribe(() => {

            this.carregarKanban();

        });
    }


    /**
     * Executado quando o usuário solta uma oportunidade
     * em uma coluna do Kanban.
     */
    moverOportunidade(
        event: CdkDragDrop<any>,
        colunaDestino: OportunidadeKanbanDto
    ): void {

        const oportunidade = event.item.data;

        if (!oportunidade) {
            return;
        }


        const statusAtualId =
            oportunidade.statusNegociacaoId;

        const novoStatusId =
            colunaDestino.statusId;


        // Soltou na mesma coluna
        if (statusAtualId === novoStatusId) {
            return;
        }


        const statusAtual = this.kanban.find(
            x => x.statusId === statusAtualId
        );


        const nomeStatusAtual =
            statusAtual?.statusNome ||
            oportunidade.statusNegociacaoNome ||
            'etapa atual';


        const nomeNovoStatus =
            colunaDestino.statusNome ||
            'nova etapa';


        abp.message.confirm(

            `Deseja mover a oportunidade "${oportunidade.titulo}" de "${nomeStatusAtual}" para "${nomeNovoStatus}"?`,

            'Alterar etapa',

            (result: boolean) => {

                if (!result) {
                    return;
                }

                this.alterarStatus(
                    oportunidade,
                    colunaDestino
                );
            }
        );
    }


    private alterarStatus(
        oportunidade: any,
        colunaDestino: OportunidadeKanbanDto
    ): void {

        if (this.oportunidadeMovendo) {
            return;
        }


        this.oportunidadeMovendo = true;


        const input =
            new AlterarStatusOportunidadeDto();

        input.oportunidadeId =
            oportunidade.id;

        input.statusNegociacaoId =
            colunaDestino.statusId;


        this._oportunidadesService
            .alterarStatus(input)
            .subscribe({

                next: () => {

                    this.oportunidadeMovendo = false;

                    this.notify.success(
                        'Oportunidade movida com sucesso.'
                    );

                    this.carregarKanban();

                    this.cd.detectChanges();
                },

                error: () => {

                    this.oportunidadeMovendo = false;

                    this.cd.detectChanges();
                }

            });
    }
}