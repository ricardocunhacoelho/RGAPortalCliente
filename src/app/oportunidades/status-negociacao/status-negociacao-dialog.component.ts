import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { AppComponentBase } from '@shared/app-component-base';

import {
    StatusNegociacoesServiceProxy,
    StatusNegociacaoDto,
    CreateStatusNegociacaoDto,
    UpdateStatusNegociacaoDto,
} from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'app-status-negociacao-dialog',
    templateUrl: './status-negociacao-dialog.component.html',
    standalone: true,
    imports: [
        FormsModule,
        NgFor,
        NgIf,
    ],
})
export class StatusNegociacaoDialogComponent
    extends AppComponentBase
    implements OnInit {

    @Output() onSave = new EventEmitter<void>();

    status: StatusNegociacaoDto[] = [];

    criando = false;
    editando = false;
    salvando = false;

    statusSelecionado: StatusNegociacaoDto | null = null;

    nome = '';
    cor = '#2563eb';
    ativo = true;
    ganho = false;
    perdido = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private _statusService: StatusNegociacoesServiceProxy,
        private cd: ChangeDetectorRef

    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.carregar();
    }

    carregar(): void {
        this._statusService
            .getAll()
            .subscribe(result => {
                this.status = result || [];
                this.cd.detectChanges();
            });
    }

    novo(): void {
        this.criando = true;
        this.editando = false;
        this.statusSelecionado = null;

        this.nome = '';
        this.cor = '#2563eb';
        this.ativo = true;
        this.ganho = false;
        this.perdido = false;
    }

    editar(item: StatusNegociacaoDto): void {
        this.criando = false;
        this.editando = true;

        this.statusSelecionado = item;

        this.nome = item.nome || '';
        this.cor = item.cor || '#2563eb';
        this.ativo = item.ativo;
        this.ganho = item.ganho;
        this.perdido = item.perdido;
    }

    cancelarEdicao(): void {
        this.criando = false;
        this.editando = false;
        this.statusSelecionado = null;
    }

    salvar(): void {

        if (!this.nome || !this.nome.trim()) {
            this.notify.warn('Informe o nome do estágio.');
            return;
        }

        this.salvando = true;

        if (this.editando && this.statusSelecionado) {

            const input = new UpdateStatusNegociacaoDto();

            input.id = this.statusSelecionado.id;
            input.nome = this.nome.trim();
            input.cor = this.cor;
            input.ativo = this.ativo;
            input.ganho = this.ganho;
            input.perdido = this.perdido;
            input.ordem = this.statusSelecionado.ordem;

            this._statusService
                .update(input)
                .subscribe(
                    () => {

                        this.salvando = false;

                        this.notify.success('Estágio atualizado.');

                        this.cancelarEdicao();

                        this.carregar();

                        this.cd.detectChanges();

                        this.onSave.emit();
                    },
                    () => {

                        this.salvando = false;

                        this.cd.detectChanges();
                    }
                );

            return;
        }

        const input = new CreateStatusNegociacaoDto();

        input.nome = this.nome.trim();
        input.cor = this.cor;
        input.ativo = this.ativo;
        input.ganho = this.ganho;
        input.perdido = this.perdido;
        input.ordem = this.status.length + 1;

        this._statusService
            .create(input)
            .subscribe(
                () => {

                    this.salvando = false;

                    this.notify.success('Estágio criado.');

                    // Volta para a tela de gerenciamento
                    this.cancelarEdicao();

                    // Recarrega a lista
                    this.carregar();

                    // Força a atualização visual do modal
                    this.cd.detectChanges();

                    // Atualiza o Kanban da tela principal
                    this.onSave.emit();
                },
                () => {

                    this.salvando = false;

                    this.cd.detectChanges();
                }
            );
    }

    excluir(item: StatusNegociacaoDto): void {

        abp.message.confirm(
            `Deseja excluir o estágio "${item.nome}"?`,
            undefined,
            (result: boolean) => {

                if (!result) {
                    return;
                }

                this._statusService
                    .delete(item.id)
                    .subscribe(() => {

                        abp.notify.success('Estágio excluído.');

                        this.carregar();
                        this.onSave.emit();
                    });
            }
        );
    }

    fechar(): void {
        this.bsModalRef.hide();
    }
}