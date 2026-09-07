import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Injector,
    OnInit,
    Output
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';
import moment from 'moment';

import { AppComponentBase } from '@shared/app-component-base';

import {
    ClientesServiceProxy,
    VendedoresServiceProxy,
    StatusNegociacoesServiceProxy,
    OportunidadesServiceProxy,
    CreateOportunidadeDto,
    UpdateOportunidadeDto,
    StatusNegociacaoDto
} from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'app-create-oportunidade-dialog',
    templateUrl: './create-oportunidade-dialog.component.html',
    standalone: true,
    imports: [
        FormsModule,
        NgFor,
        NgIf
    ]
})
export class CreateOportunidadeDialogComponent
    extends AppComponentBase
    implements OnInit {

    @Output() onSave = new EventEmitter<void>();

    /**
     * Quando preenchido, a modal funciona como edição.
     * Quando vazio, funciona como criação.
     */
    public oportunidadeId?: string;

    clientes: any[] = [];
    vendedores: any[] = [];
    statusNegociacoes: StatusNegociacaoDto[] = [];

    clienteId: string | undefined;
    vendedorId: string | undefined;
    statusNegociacaoId: string | undefined;

    titulo = '';
    descricao = '';

    valorEstimado: number | undefined;
    probabilidade: number | undefined;

    previsaoFechamento = '';

    carregando = false;
    salvando = false;


    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,

        private _clientesService: ClientesServiceProxy,
        private _vendedoresService: VendedoresServiceProxy,
        private _statusService: StatusNegociacoesServiceProxy,
        private _oportunidadesService: OportunidadesServiceProxy,

        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }


    ngOnInit(): void {
        this.carregar();
    }


    get modoEdicao(): boolean {
        return !!this.oportunidadeId;
    }


    get tituloModal(): string {
        return this.modoEdicao
            ? 'Editar Oportunidade'
            : 'Nova Oportunidade';
    }


    get textoBotaoSalvar(): string {
        return this.modoEdicao
            ? 'Salvar alterações'
            : 'Criar oportunidade';
    }


    carregar(): void {

        this.carregando = true;

        let carregados = 0;

        const finalizar = () => {

            carregados++;

            if (carregados >= 3) {

                if (this.modoEdicao) {
                    this.carregarOportunidade();
                } else {

                    this.carregando = false;

                    this.cd.detectChanges();
                }
            }
        };


        // Clientes
        this._clientesService
            .getForSelect()
            .subscribe(
                result => {

                    this.clientes = result || [];

                    finalizar();
                },
                () => {

                    finalizar();
                }
            );


        // Vendedores
        this._vendedoresService
            .getForSelect()
            .subscribe(
                result => {

                    this.vendedores = result || [];

                    finalizar();
                },
                () => {

                    finalizar();
                }
            );


        // Estágios
        this._statusService
            .getAll()
            .subscribe(
                result => {

                    this.statusNegociacoes = (result || [])
                        .filter(x => x.ativo)
                        .sort((a, b) => a.ordem - b.ordem);

                    // Só seleciona o primeiro estágio
                    // quando for uma nova oportunidade.
                    if (
                        !this.modoEdicao &&
                        this.statusNegociacoes.length > 0
                    ) {
                        this.statusNegociacaoId =
                            this.statusNegociacoes[0].id;
                    }

                    finalizar();
                },
                () => {

                    finalizar();
                }
            );
    }


    private carregarOportunidade(): void {

        if (!this.oportunidadeId) {
            this.carregando = false;
            this.cd.detectChanges();
            return;
        }

        this._oportunidadesService
            .get(this.oportunidadeId)
            .subscribe(
                result => {

                    this.clienteId =
                        result.clienteId;

                    this.vendedorId =
                        result.vendedorId;

                    this.statusNegociacaoId =
                        result.statusNegociacaoId;

                    this.titulo =
                        result.titulo || '';

                    this.descricao =
                        result.descricao || '';

                    this.valorEstimado =
                        result.valorEstimado;

                    this.probabilidade =
                        result.probabilidade;

                    this.previsaoFechamento =
                        result.previsaoFechamento
                            ? result.previsaoFechamento.format(
                                'YYYY-MM-DD'
                            )
                            : '';

                    this.carregando = false;

                    this.cd.detectChanges();
                },
                () => {

                    this.carregando = false;

                    this.notify.error(
                        'Não foi possível carregar a oportunidade.'
                    );

                    this.cd.detectChanges();
                }
            );
    }


    salvar(): void {

        if (!this.clienteId) {

            this.notify.warn(
                'Selecione um cliente.'
            );

            return;
        }


        if (!this.titulo || !this.titulo.trim()) {

            this.notify.warn(
                'Informe o título da oportunidade.'
            );

            return;
        }


        if (!this.statusNegociacaoId) {

            this.notify.warn(
                'Selecione o estágio da oportunidade.'
            );

            return;
        }


        if (
            this.valorEstimado !== undefined &&
            this.valorEstimado < 0
        ) {

            this.notify.warn(
                'O valor estimado não pode ser negativo.'
            );

            return;
        }


        if (
            this.probabilidade !== undefined &&
            (
                this.probabilidade < 0 ||
                this.probabilidade > 100
            )
        ) {

            this.notify.warn(
                'A probabilidade deve estar entre 0 e 100%.'
            );

            return;
        }


        this.salvando = true;

        this.cd.detectChanges();


        if (this.modoEdicao) {

            this.atualizar();

        } else {

            this.criar();
        }
    }


    private criar(): void {

        if (!this.clienteId) {
            this.salvando = false;
            this.notify.warn('Selecione um cliente.');
            return;
        }

        if (!this.statusNegociacaoId) {
            this.salvando = false;
            this.notify.warn('Selecione o estágio da oportunidade.');
            return;
        }

        const input = new CreateOportunidadeDto();

        input.clienteId =
            this.clienteId;

        input.vendedorId =
            this.vendedorId;

        input.statusNegociacaoId =
            this.statusNegociacaoId;

        input.titulo =
            this.titulo
                ? this.titulo.trim()
                : undefined;

        input.descricao =
            this.descricao
                ? this.descricao.trim()
                : undefined;

        input.valorEstimado =
            this.valorEstimado;

        input.probabilidade =
            this.probabilidade;

        input.previsaoFechamento =
            this.previsaoFechamento
                ? moment(
                    this.previsaoFechamento,
                    'YYYY-MM-DD'
                )
                : undefined;


        this._oportunidadesService
            .create(input)
            .subscribe({

                next: () => {

                    this.salvando = false;

                    this.notify.success(
                        'Oportunidade criada.'
                    );

                    this.cd.detectChanges();

                    this.onSave.emit();

                    this.bsModalRef.hide();
                },

                error: () => {

                    this.salvando = false;

                    this.cd.detectChanges();
                }
            });
    }


    private atualizar(): void {

        if (!this.oportunidadeId) {
            this.salvando = false;
            return;
        }

        if (!this.clienteId) {
            this.salvando = false;
            this.notify.warn('Selecione um cliente.');
            return;
        }

        if (!this.statusNegociacaoId) {
            this.salvando = false;
            this.notify.warn('Selecione o estágio da oportunidade.');
            return;
        }

        const input = new UpdateOportunidadeDto();

        input.id = this.oportunidadeId;

        input.clienteId = this.clienteId;

        input.vendedorId = this.vendedorId;

        input.statusNegociacaoId = this.statusNegociacaoId;

        input.titulo = this.titulo
            ? this.titulo.trim()
            : undefined;

        input.descricao = this.descricao
            ? this.descricao.trim()
            : undefined;

        input.valorEstimado = this.valorEstimado;

        input.probabilidade = this.probabilidade;

        input.previsaoFechamento = this.previsaoFechamento
            ? moment(
                this.previsaoFechamento,
                'YYYY-MM-DD'
            )
            : undefined;

        this._oportunidadesService
            .update(input)
            .subscribe({

                next: () => {

                    this.salvando = false;

                    this.notify.success(
                        'Oportunidade atualizada.'
                    );

                    this.cd.detectChanges();

                    this.onSave.emit();

                    this.bsModalRef.hide();
                },

                error: () => {

                    this.salvando = false;

                    this.cd.detectChanges();
                }
            });
    }


    cancelar(): void {

        if (this.salvando) {
            return;
        }

        this.bsModalRef.hide();
    }
}