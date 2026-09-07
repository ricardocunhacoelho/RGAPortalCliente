import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/app-component-base';

import {
    ClientesServiceProxy,
    ClienteDto,
    ClienteDtoPagedResultDto,
} from '@shared/service-proxies/service-proxies';

import { BsModalService } from 'ngx-bootstrap/modal';
import { CreateClienteDialogComponent } from './create-cliente/create-cliente-dialog.component';

@Component({
    animations: [appModuleAnimation()],
    templateUrl: './clientes.component.html',
    styleUrls: ['./clientes.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        NgIf,
        NgFor,
    ],
})
export class ClientesComponent extends AppComponentBase implements OnInit {

    clientes: ClienteDto[] = [];

    keyword = '';

    carregando = false;

    constructor(
        injector: Injector,
        private _clientesService: ClientesServiceProxy,
        private _modalService: BsModalService,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.carregarClientes();
    }

    carregarClientes(): void {

        this.carregando = true;

        this._clientesService
            .getAll(
                this.keyword || undefined,
                undefined,
                undefined,
                0,
                100
            )
            .subscribe({
                next: (result: ClienteDtoPagedResultDto) => {

                    this.clientes = result.items || [];

                    this.carregando = false;

                    this.cd.detectChanges();
                },

                error: () => {

                    this.carregando = false;

                    this.cd.detectChanges();
                },
            });
    }

    pesquisar(): void {
        this.carregarClientes();
    }

    limparPesquisa(): void {
        this.keyword = '';
        this.carregarClientes();
    }

    excluir(cliente: ClienteDto): void {

        abp.message.confirm(
            `Deseja excluir o cliente "${cliente.nome || cliente.empresa}"?`,
            undefined,
            (result: boolean) => {

                if (!result) {
                    return;
                }

                this._clientesService
                    .delete(cliente.id)
                    .subscribe(() => {

                        abp.notify.success('Cliente excluído.');

                        this.carregarClientes();
                    });
            }
        );
    }

    novoCliente(): void {

        const modal = this._modalService.show(
            CreateClienteDialogComponent,
            {
                class: 'modal-lg'
            }
        );

        modal.content!.onSave.subscribe(() => {
            this.cd.detectChanges();

            this.carregarClientes();

        });
    }

    editarCliente(cliente: ClienteDto): void {
        // Próximo passo: abrir modal.
    }

}