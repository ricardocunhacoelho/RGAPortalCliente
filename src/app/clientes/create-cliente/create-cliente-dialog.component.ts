import { Component, EventEmitter, Injector, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { AppComponentBase } from '@shared/app-component-base';

import {
    ClientesServiceProxy,
    CreateClienteDto,
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-create-cliente-dialog',
    templateUrl: './create-cliente-dialog.component.html',
    standalone: true,
    imports: [
        FormsModule,
    ],
})
export class CreateClienteDialogComponent extends AppComponentBase {

    @Output() onSave = new EventEmitter<void>();

    nome = '';
    empresa = '';
    telefone = '';
    email = '';
    observacoes = '';

    salvando = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private _clientesService: ClientesServiceProxy
    ) {
        super(injector);
    }

    salvar(): void {

        if (!this.nome.trim() && !this.empresa.trim()) {

            this.notify.warn(
                'Informe o nome ou a empresa do cliente.'
            );

            return;
        }

        this.salvando = true;

        const input = new CreateClienteDto();

        input.nome = this.nome.trim();
        input.empresa = this.empresa.trim();
        input.telefone = this.telefone.trim();
        input.email = this.email.trim();
        input.observacoes = this.observacoes.trim();

        this._clientesService
            .create(input)
            .subscribe({
                next: () => {

                    this.salvando = false;

                    this.notify.success(
                        'Cliente criado com sucesso.'
                    );

                    this.onSave.emit();

                    this.bsModalRef.hide();
                },

                error: () => {

                    this.salvando = false;

                },
            });
    }

    fechar(): void {
        this.bsModalRef.hide();
    }
}