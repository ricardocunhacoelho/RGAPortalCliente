import {
    ChangeDetectorRef,
    Component,
    Injector,
    OnDestroy,
    OnInit
} from '@angular/core';

import { Subscription } from 'rxjs';

import { WhatsAppSignalRService }
    from '@shared/services/whatsapp-signalr.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponentBase }
    from '@shared/app-component-base';

import {
    ConversasServiceProxy,
    ConversaResumoDto,
    CriarOuObterConversaDto,
    ClienteDto
} from '@shared/service-proxies/service-proxies';

import { NovaConversaComponent }
    from './nova-conversa/nova-conversa.component';

import { ConversaComponent }
    from './conversa/conversa.component';

import moment from 'moment';


@Component({
    templateUrl: './conversas.component.html',
    styleUrls: ['./conversas.component.scss'],

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        NovaConversaComponent,
        ConversaComponent
    ]
})
export class ConversasComponent
    extends AppComponentBase
    implements OnInit, OnDestroy {

    // ============================================================
    // LISTA DE CONVERSAS
    // ============================================================

    conversas: ConversaResumoDto[] = [];

    conversaSelecionadaId: string | null = null;


    // ============================================================
    // NOVA CONVERSA
    // ============================================================

    exibindoNovaConversa = false;


    // ============================================================
    // LOADING
    // ============================================================

    carregando = false;

    carregandoMais = false;


    // ============================================================
    // PAGINAÇÃO / PESQUISA
    // ============================================================

    keyword = '';

    skipCount = 0;

    readonly pageSize = 20;

    totalCount = 0;

    temMaisConversas = true;


    // ============================================================
    // SIGNALR
    // ============================================================

    private whatsappSignalRSubscription:
        Subscription | null = null;


    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(
        injector: Injector,

        private _conversasService:
            ConversasServiceProxy,

        private _whatsAppSignalR:
            WhatsAppSignalRService,

        private cd:
            ChangeDetectorRef
    ) {
        super(injector);
    }


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        // Carrega a lista inicial
        this.carregarConversas(true);


        // Escuta mensagens em tempo real
        this.whatsappSignalRSubscription =
            this._whatsAppSignalR
                .mensagemWhatsApp$
                .subscribe((evento) => {

                    this.atualizarConversaEmTempoReal(
                        evento
                    );

                });
    }


    // ============================================================
    // DESTROY
    // ============================================================

    ngOnDestroy(): void {

        if (this.whatsappSignalRSubscription) {

            this.whatsappSignalRSubscription.unsubscribe();

            this.whatsappSignalRSubscription = null;
        }
    }


    // ============================================================
    // SIGNALR
    // Atualiza o resumo da conversa em tempo real
    // ============================================================

    atualizarConversaEmTempoReal(
        evento: any
    ): void {

        if (!evento) {
            return;
        }

        if (!evento.conversaId) {
            return;
        }


        // ========================================================
        // PROCURA A CONVERSA NA LISTA
        // ========================================================

        const indice =
            this.conversas.findIndex(
                x =>
                    x.id === evento.conversaId
            );


        // ========================================================
        // CONVERSA NÃO ESTÁ NA LISTA ATUAL
        //
        // Pode estar em outra página ou ser uma nova conversa.
        // Nesse caso, recarregamos a lista.
        // ========================================================

        if (indice === -1) {

            this.carregarConversas(true);

            return;
        }


        const conversa =
            this.conversas[indice];


        // ========================================================
        // ÚLTIMA MENSAGEM
        // ========================================================

        if (
            evento.ultimaMensagem !== undefined
        ) {

            conversa.ultimaMensagem =
                evento.ultimaMensagem;
        }


        // ========================================================
        // DATA DA ÚLTIMA MENSAGEM
        // ========================================================

        if (evento.ultimaMensagemEm) {

            conversa.ultimaMensagemEm =
                moment(
                    evento.ultimaMensagemEm
                ) as any;
        }


        // ========================================================
        // MENSAGEM RECEBIDA
        // ========================================================

        if (
            evento.direcao === 'Recebida'
        ) {

            conversa.ultimaMensagemDoCliente =
                true;


            /*
             * Só aumenta o contador se a conversa
             * NÃO estiver aberta.
             *
             * Se o usuário está dentro da conversa,
             * ela não deve aparecer como não visualizada.
             */

            if (
                this.conversaSelecionadaId !==
                evento.conversaId
            ) {

                conversa.quantidadeNaoVisualizadas =
                    (
                        conversa.quantidadeNaoVisualizadas ||
                        0
                    ) + 1;
            }
        }


        // ========================================================
        // MENSAGEM ENVIADA
        // ========================================================

        if (
            evento.direcao === 'Enviada'
        ) {

            conversa.ultimaMensagemDoCliente =
                false;
        }


        // ========================================================
        // MOVE A CONVERSA PARA O TOPO
        // ========================================================

        this.conversas.splice(
            indice,
            1
        );

        this.conversas.unshift(
            conversa
        );


        // ========================================================
        // ATUALIZA TELA
        // ========================================================

        this.cd.detectChanges();
    }


    // ============================================================
    // CARREGAR CONVERSAS
    // ============================================================

    carregarConversas(
        reset: boolean = false
    ): void {

        // ========================================================
        // RESET
        // ========================================================

        if (reset) {

            this.skipCount = 0;

            this.temMaisConversas = true;

            this.conversas = [];
        }


        // ========================================================
        // NÃO HÁ MAIS CONVERSAS
        // ========================================================

        if (!this.temMaisConversas) {
            return;
        }


        // ========================================================
        // JÁ ESTÁ CARREGANDO MAIS
        // ========================================================

        if (this.carregandoMais) {
            return;
        }


        // ========================================================
        // DEFINE LOADING
        // ========================================================

        if (this.skipCount === 0) {

            this.carregando = true;

        } else {

            this.carregandoMais = true;
        }


        // ========================================================
        // BUSCA NO BACKEND
        // ========================================================

        this._conversasService
            .getMinhasConversas(
                this.keyword || undefined,
                undefined,
                undefined,
                true,
                this.skipCount,
                this.pageSize
            )
            .subscribe({

                // ==================================================
                // SUCESSO
                // ==================================================

                next: (result) => {

                    const novosItens =
                        result.items || [];


                    this.totalCount =
                        result.totalCount || 0;


                    // ==================================================
                    // ADICIONA OS NOVOS ITENS
                    // ==================================================

                    this.conversas = [
                        ...this.conversas,
                        ...novosItens
                    ];


                    // ==================================================
                    // ATUALIZA PAGINAÇÃO
                    // ==================================================

                    this.skipCount +=
                        novosItens.length;


                    this.temMaisConversas =
                        this.conversas.length <
                        this.totalCount;


                    // ==================================================
                    // FINALIZA LOADING
                    // ==================================================

                    this.carregando = false;

                    this.carregandoMais = false;


                    this.cd.detectChanges();
                },


                // ==================================================
                // ERRO
                // ==================================================

                error: () => {

                    this.carregando = false;

                    this.carregandoMais = false;


                    this.notify.error(
                        'Não foi possível carregar as conversas.'
                    );


                    this.cd.detectChanges();
                }

            });
    }


    // ============================================================
    // PESQUISAR
    // ============================================================

    pesquisar(): void {

        this.carregarConversas(true);
    }


    // ============================================================
    // LIMPAR PESQUISA
    // ============================================================

    limparPesquisa(): void {

        this.keyword = '';

        this.carregarConversas(true);
    }


    // ============================================================
    // SCROLL DA LISTA
    // ============================================================

    aoRolarLista(
        event: Event
    ): void {

        const elemento =
            event.target as HTMLElement;


        const distanciaDoFinal =
            elemento.scrollHeight -
            elemento.scrollTop -
            elemento.clientHeight;


        /*
         * Começa a carregar quando estiver
         * aproximadamente 150px do final.
         */

        if (
            distanciaDoFinal <= 150
        ) {

            this.carregarConversas();
        }
    }


    // ============================================================
    // SELECIONAR CONVERSA
    // ============================================================

    selecionarConversa(
        conversa: ConversaResumoDto
    ): void {

        if (!conversa) {
            return;
        }


        this.exibindoNovaConversa =
            false;


        this.conversaSelecionadaId =
            conversa.id;


        /*
         * Se havia mensagens não visualizadas,
         * zera imediatamente o contador visual.
         *
         * O backend será atualizado pelo
         * ConversaComponent ao abrir/carregar a conversa.
         */

        if (
            conversa.quantidadeNaoVisualizadas &&
            conversa.quantidadeNaoVisualizadas > 0
        ) {

            conversa.quantidadeNaoVisualizadas = 0;

            this.cd.detectChanges();
        }
    }


    // ============================================================
    // NOVA CONVERSA
    // ============================================================

    novaConversa(): void {

        this.conversaSelecionadaId =
            null;

        this.exibindoNovaConversa =
            true;
    }


    // ============================================================
    // FECHAR NOVA CONVERSA
    // ============================================================

    fecharNovaConversa(): void {

        this.exibindoNovaConversa =
            false;
    }


    // ============================================================
    // FECHAR CONVERSA
    // ============================================================

    fecharConversa(): void {

        this.conversaSelecionadaId =
            null;

        this.cd.detectChanges();
    }


    // ============================================================
    // VOLTAR PARA LISTA
    // ============================================================

    voltarParaLista(): void {

        this.conversaSelecionadaId =
            null;
    }


    // ============================================================
    // ABRIR CONVERSA PELO CLIENTE
    // ============================================================

    abrirConversa(
        cliente: ClienteDto
    ): void {

        // ========================================================
        // VALIDA CLIENTE
        // ========================================================

        if (!cliente) {
            return;
        }


        // ========================================================
        // VALIDA ID
        // ========================================================

        if (!cliente.id) {

            this.notify.warn(
                'O cliente não foi identificado.'
            );

            return;
        }


        // ========================================================
        // VALIDA TELEFONE
        // ========================================================

        if (
            !cliente.telefone ||
            !cliente.telefone.trim()
        ) {

            this.notify.warn(
                'O cliente não possui telefone cadastrado.'
            );

            return;
        }


        // ========================================================
        // LOADING
        // ========================================================

        this.carregando = true;


        // ========================================================
        // INPUT
        // ========================================================

        const input =
            new CriarOuObterConversaDto();


        // ========================================================
        // CLIENTE
        // ========================================================

        input.clienteId =
            cliente.id;


        // ========================================================
        // TELEFONE
        // ========================================================

        input.telefone =
            cliente.telefone;


        // ========================================================
        // CANAL
        // ========================================================

        input.canal =
            'WhatsApp';


        /*
         * IMPORTANTE:
         *
         * Não preencher VendedorId aqui.
         *
         * O backend identifica o vendedor
         * através do usuário logado.
         */


        // ========================================================
        // CRIA / OBTÉM CONVERSA
        // ========================================================

        this._conversasService
            .criarOuObter(input)
            .subscribe({

                // ==================================================
                // SUCESSO
                // ==================================================

                next: (conversa) => {

                    this.carregando = false;


                    // ==================================================
                    // FECHA NOVA CONVERSA
                    // ==================================================

                    this.exibindoNovaConversa =
                        false;


                    // ==================================================
                    // ABRE CONVERSA
                    // ==================================================

                    this.conversaSelecionadaId =
                        conversa.id;


                    // ==================================================
                    // ATUALIZA LISTA
                    // ==================================================

                    this.carregarConversas(true);


                    this.cd.detectChanges();
                },


                // ==================================================
                // ERRO
                // ==================================================

                error: () => {

                    this.carregando = false;


                    this.notify.error(
                        'Não foi possível abrir a conversa.'
                    );


                    this.cd.detectChanges();
                }

            });
    }
}