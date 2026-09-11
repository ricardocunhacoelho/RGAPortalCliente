import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Injector,
    OnInit,
    Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponentBase } from '@shared/app-component-base';

import {
    ClientesServiceProxy,
    ClienteDto
} from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'app-nova-conversa',

    templateUrl: './nova-conversa.component.html',

    styleUrls: ['./nova-conversa.component.scss'],

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ]
})
export class NovaConversaComponent
    extends AppComponentBase
    implements OnInit {

    @Output()
    onSave = new EventEmitter<void>();

    @Output()
    onClose = new EventEmitter<void>();

    @Output()
    onAbrirConversa =
        new EventEmitter<ClienteDto>();


    // Cliente cadastrado
    clienteId: string | null = null;

    clientes: ClienteDto[] = [];

    clientesFiltrados: ClienteDto[] = [];

    pesquisaCliente = '';

    clienteSelecionado: ClienteDto | null = null;

    carregandoClientes = false;


    // Cliente não cadastrado
    clienteNaoCadastrado = false;

    nomeCliente = '';

    telefone = '';


    // Primeira mensagem
    mensagem = '';


    carregando = false;


    constructor(
        injector: Injector,

        private _clientesService: ClientesServiceProxy,

        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }


    ngOnInit(): void {

        this.carregarClientes();

    }


    /**
     * Carrega os clientes cadastrados.
     */
    carregarClientes(): void {

        this.carregandoClientes = true;

        this._clientesService
            .getAll(
                undefined,
                undefined,
                undefined,
                0,
                1000
            )
            .subscribe({

                next: (result) => {

                    this.clientes =
                        result.items || [];

                    this.clientesFiltrados =
                        [...this.clientes];

                    this.carregandoClientes = false;

                    this.cd.detectChanges();
                },

                error: () => {

                    this.carregandoClientes = false;

                    this.notify.error(
                        'Não foi possível carregar os clientes.'
                    );

                    this.cd.detectChanges();
                }

            });
    }


    /**
     * Filtra os clientes pelo nome,
     * empresa ou telefone.
     */
    pesquisarClientes(): void {

        const termo =
            (this.pesquisaCliente || '')
                .trim()
                .toLowerCase();


        if (!termo) {

            this.clientesFiltrados =
                [...this.clientes];

            return;
        }


        this.clientesFiltrados =
            this.clientes.filter(cliente => {

                const nome =
                    (cliente.nome || '')
                        .toLowerCase();

                const empresa =
                    (cliente.empresa || '')
                        .toLowerCase();

                const telefone =
                    (cliente.telefone || '')
                        .toLowerCase();


                return (
                    nome.includes(termo) ||
                    empresa.includes(termo) ||
                    telefone.includes(termo)
                );

            });
    }


    /**
     * Seleciona um cliente.
     */
    selecionarCliente(cliente: ClienteDto): void {

        this.clienteSelecionado = cliente;

        this.clienteId = cliente.id;

        this.pesquisaCliente = '';

        this.clientesFiltrados =
            [...this.clientes];

        this.clienteNaoCadastrado = false;

        this.nomeCliente = '';

        this.telefone = '';

        this.mensagem = '';
    }


    /**
     * Remove a seleção atual.
     */
    removerClienteSelecionado(): void {

        this.clienteSelecionado = null;

        this.clienteId = null;

        this.pesquisaCliente = '';

        this.clientesFiltrados =
            [...this.clientes];
    }


    enviarParaClienteNaoCadastrado(): void {

        this.clienteNaoCadastrado = true;

        this.clienteId = null;

        this.clienteSelecionado = null;
    }


    voltarSelecaoCliente(): void {

        this.clienteNaoCadastrado = false;

        this.nomeCliente = '';

        this.telefone = '';

        this.mensagem = '';

        this.clienteSelecionado = null;

        this.clienteId = null;

        this.pesquisaCliente = '';

        this.clientesFiltrados =
            [...this.clientes];
    }


    /**
     * Abre uma conversa com o cliente selecionado.
     */
    abrirConversa(): void {

        if (this.carregando) {
            return;
        }


        if (!this.clienteSelecionado) {

            this.notify.warn(
                'Selecione um cliente.'
            );

            return;
        }


        if (!this.clienteSelecionado.id) {

            this.notify.warn(
                'O cliente selecionado não possui identificador.'
            );

            return;
        }


        if (
            !this.clienteSelecionado.telefone ||
            !this.clienteSelecionado.telefone.trim()
        ) {

            this.notify.warn(
                'O cliente selecionado não possui telefone cadastrado.'
            );

            return;
        }


        this.carregando = true;


        /*
         * Envia o cliente completo para o componente pai.
         *
         * O componente pai será responsável por
         * montar o CriarOuObterConversaDto.
         */
        this.onAbrirConversa.emit(
            this.clienteSelecionado
        );
    }


    cancelar(): void {

        if (this.carregando) {
            return;
        }

        this.onClose.emit();
    }


    fechar(): void {

        this.cancelar();

    }


    enviar(): void {

        if (this.carregando) {
            return;
        }


        if (!this.mensagem ||
            !this.mensagem.trim()) {

            this.notify.warn(
                'Informe a mensagem.'
            );

            return;
        }


        if (this.clienteNaoCadastrado) {

            if (
                !this.nomeCliente ||
                !this.nomeCliente.trim()
            ) {

                this.notify.warn(
                    'Informe o nome do cliente.'
                );

                return;
            }


            if (
                !this.telefone ||
                !this.telefone.trim()
            ) {

                this.notify.warn(
                    'Informe o telefone do cliente.'
                );

                return;
            }

        } else {

            if (!this.clienteId) {

                this.notify.warn(
                    'Selecione um cliente.'
                );

                return;
            }

        }


        /*
         * O envio para cliente não cadastrado
         * será conectado posteriormente ao
         * WhatsAppServiceProxy.
         */

        this.notify.info(
            'Integração de envio será conectada.'
        );
    }

}