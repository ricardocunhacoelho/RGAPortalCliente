import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AppComponentBase } from '@shared/app-component-base';
import { firstValueFrom } from 'rxjs';
import {
    WhatsAppSignalRService
} from '@shared/services/whatsapp-signalr.service';

import {
    ConversasServiceProxy,
    MensagensServiceProxy,
    ConversaDto,
    MensagemDto,
    EnviarMensagemWhatsAppDto,
    WhatsAppServiceProxy,
    AnalisesIAServiceProxy,
    AnaliseConversaDto
} from '@shared/service-proxies/service-proxies';

import { SelecionarTemplateComponent }
    from '../selecionar-template/selecionar-template.component';


@Component({
    selector: 'app-conversa',

    templateUrl: './conversa.component.html',

    styleUrls: ['./conversa.component.scss'],

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        SelecionarTemplateComponent
    ]
})
export class ConversaComponent
    extends AppComponentBase
    implements OnChanges, OnDestroy {


    // ============================================================
    // INPUT / OUTPUT
    // ============================================================

    @Input()
    conversaId: string | null = null;


    @Output()
    onClose = new EventEmitter<void>();


    @ViewChild('mensagensContainer')
    mensagensContainer!:
        ElementRef<HTMLElement>;


    conversa: ConversaDto | null = null;

    mensagens: MensagemDto[] = [];

    // ============================================================
    // ANÁLISE DA IA
    // ============================================================

    analiseIA: AnaliseConversaDto | null = null;

    carregandoAnaliseIA = false;

    erroAnaliseIA = false;


    mensagem = '';

    carregando = false;

    carregandoMensagens = false;

    carregandoMaisMensagens = false;

    enviando = false;

    busyCarregamentoConversa = false;

    numeroCarregamentoConversa = 0;

    exibindoTemplates = false;

    skipCount = 0;

    readonly pageSize = 30;

    totalMensagens = 0;

    temMaisMensagens = true;

    janelaExpirada = false;

    textoJanela = '';

    private whatsappSignalRSubscription:
        Subscription | null = null;

    constructor(
        injector: Injector,

        private _conversasService:
            ConversasServiceProxy,

        private _mensagensService:
            MensagensServiceProxy,

        private _whatsAppService:
            WhatsAppServiceProxy,

        private _analisesIAService:
            AnalisesIAServiceProxy,

        private _whatsAppSignalR:
            WhatsAppSignalRService,

        private cd:
            ChangeDetectorRef
    ) {
        super(injector);
    }

    private escutarSignalR(): void {

        if (this.whatsappSignalRSubscription) {
            return;
        }

        this.whatsappSignalRSubscription =
            this._whatsAppSignalR
                .mensagemWhatsApp$
                .subscribe((evento) => {

                    this.receberMensagemEmTempoReal(
                        evento
                    );

                });
    }

    ngOnDestroy(): void {

        if (
            this.whatsappSignalRSubscription
        ) {

            this.whatsappSignalRSubscription.unsubscribe();

            this.whatsappSignalRSubscription =
                null;
        }
    }

    ngOnChanges(
        changes: SimpleChanges
    ): void {

        if (
            changes['conversaId'] &&
            this.conversaId
        ) {

            this.escutarSignalR();

            this.exibindoTemplates = false;

            this.carregarConversa();
        }
    }

    private receberMensagemEmTempoReal(
        evento: any
    ): void {

        if (!evento) {
            return;
        }


        if (!evento.conversaId) {
            return;
        }


        // A mensagem pertence a outra conversa.
        if (
            evento.conversaId !==
            this.conversaId
        ) {
            return;
        }


        // Evita duplicar a mensagem.
        if (
            evento.mensagemId &&
            this.mensagens.some(
                x =>
                    x.id === evento.mensagemId
            )
        ) {
            return;
        }


        const mensagem =
            {
                id: evento.mensagemId,

                conversaId:
                    evento.conversaId,

                direcao:
                    evento.direcao,

                tipo:
                    evento.tipo,

                conteudo:
                    evento.conteudo,

                dataHora:
                    evento.dataHora
            } as MensagemDto;


        this.mensagens.push(
            mensagem
        );


        this.cd.detectChanges();


        this.scrollParaFinal();

        const conversaIdAtual =
            this.conversaId;

        this.analisarConversaIA(
            conversaIdAtual!,
            this.numeroCarregamentoConversa
        );

    }

    private async carregarConversa(): Promise<void> {

        if (!this.conversaId) {
            return;
        }

        const numeroCarregamento =
            ++this.numeroCarregamentoConversa;

        this.carregando = true;
        this.carregandoMensagens = true;

        this.erroAnaliseIA = false;
        this.analiseIA = null;

        // Sempre começa limpa ao trocar de conversa
        this.mensagens = [];

        try {

            // ========================================================
            // 1. CARREGA A CONVERSA
            // ========================================================

            const conversa =
                await this._conversasService
                    .get(this.conversaId)
                    .toPromise();

            // Se o usuário já trocou de conversa enquanto carregava,
            // ignora o resultado antigo.
            if (
                numeroCarregamento !==
                this.numeroCarregamentoConversa
            ) {
                return;
            }

            this.conversa = conversa ?? null;

            // ========================================================
            // 2. CARREGA AS MENSAGENS
            // ========================================================

            await this.carregarMensagens(true);


            // ========================================================
            // 3. SE NÃO TEM MENSAGENS, NÃO ANALISA A IA
            // ========================================================

            if (
                !this.mensagens ||
                this.mensagens.length === 0
            ) {

                this.analiseIA = null;
                this.erroAnaliseIA = false;
                this.carregandoAnaliseIA = false;

                return;
            }


            // ========================================================
            // 4. SÓ ANALISA SE EXISTIR HISTÓRICO
            // ========================================================

            await this.analisarConversaIA(
                this.conversaId,
                numeroCarregamento
            );

        }
        catch (error) {

            console.error(
                'Erro ao carregar conversa:',
                error
            );

            // Importante:
            // não transforma ausência de mensagens em erro.
            this.mensagens =
                this.mensagens || [];

        }
        finally {

            this.carregando = false;
            this.carregandoMensagens = false;

        }
    }

    atualizarStatusJanela(): void {

        if (!this.conversa) {

            this.janelaExpirada = true;

            this.textoJanela = '';

            return;
        }


        this.janelaExpirada =
            !this.conversa.dentroJanela24h;


        if (this.janelaExpirada) {

            this.textoJanela =
                'A janela de atendimento de 24 horas foi encerrada.';

            return;
        }


        if (this.conversa.limiteJanela24h) {

            const limite =
                this.conversa.limiteJanela24h;


            if (
                typeof limite.format ===
                'function'
            ) {

                this.textoJanela =
                    'Você pode enviar mensagens livres até ' +
                    limite.format('DD/MM/YYYY HH:mm') +
                    '.';

            } else {

                this.textoJanela =
                    'Janela de atendimento aberta.';
            }

            return;
        }


        this.textoJanela =
            'Janela de atendimento aberta.';
    }



    private async carregarMensagens(
        reset: boolean = false
    ): Promise<void> {

        if (!this.conversaId) {
            return;
        }

        if (reset) {

            this.mensagens = [];
            this.skipCount = 0;
            this.carregandoMaisMensagens = false;

        }

        this.carregandoMensagens = true;

        try {

            const resultado =
                await firstValueFrom(
                    this._mensagensService.getAll(
                        this.conversaId,
                        undefined,
                        undefined,
                        undefined,
                        this.skipCount,
                        this.pageSize
                    )
                );


            // ========================================================
            // SEM MENSAGENS = NORMAL
            // ========================================================

            if (
                !resultado ||
                !resultado.items ||
                resultado.items.length === 0
            ) {

                if (reset) {
                    this.mensagens = [];
                }

                return;
            }


            // ========================================================
            // ADICIONA AS MENSAGENS
            // ========================================================

            if (reset) {

                this.mensagens =
                    resultado.items;

            }
            else {

                this.mensagens = [
                    ...resultado.items,
                    ...this.mensagens
                ];

            }


            this.skipCount +=
                resultado.items.length;


        }
        catch (error) {

            console.error(
                'Erro ao carregar mensagens:',
                error
            );

            // Não quebra a tela.
            // Uma conversa pode simplesmente não ter mensagens.
            if (reset) {
                this.mensagens = [];
            }

        }
        finally {

            this.carregandoMensagens = false;
            this.carregandoMaisMensagens = false;

        }
    }

    marcarMensagensComoLidas(
        conversaId: string,
        carregamentoAtual: number
    ): void {

        this._conversasService
            .marcarComoVisualizadas(conversaId)
            .subscribe({

                next: () => {

                    // Evita atualizar uma conversa
                    // que já foi trocada.
                    if (
                        this.conversaId !== conversaId ||
                        carregamentoAtual !==
                        this.numeroCarregamentoConversa
                    ) {
                        return;
                    }

                    this.cd.detectChanges();
                },

                error: (erro) => {

                    console.error(
                        '[WhatsApp] Erro ao marcar mensagens como lidas:',
                        erro
                    );

                }

            });
    }


    scrollParaFinal(): void {

        setTimeout(() => {

            if (
                !this.mensagensContainer
            ) {
                return;
            }


            const elemento =
                this.mensagensContainer.nativeElement;


            elemento.scrollTop =
                elemento.scrollHeight;


        }, 0);
    }

    restaurarScroll(
        alturaAnterior: number,
        scrollTopAnterior: number
    ): void {

        setTimeout(() => {

            if (
                !this.mensagensContainer
            ) {
                return;
            }


            const elemento =
                this.mensagensContainer.nativeElement;


            const alturaNova =
                elemento.scrollHeight;


            const diferenca =
                alturaNova -
                alturaAnterior;


            elemento.scrollTop =
                scrollTopAnterior +
                diferenca;


        }, 0);
    }

    aoRolarMensagens(
        event: Event
    ): void {

        const elemento =
            event.target as HTMLElement;


        if (
            elemento.scrollTop <= 150
        ) {
            this.carregarMensagens();
        }
    }

    // ============================================================
    // ANÁLISE DA IA
    // ============================================================

    analisarConversaIA(
        conversaId: string,
        carregamentoAtual: number
    ): void {

        this.analiseIA = null;
        this.carregandoAnaliseIA = true;
        this.erroAnaliseIA = false;

        this._analisesIAService
            .analisarConversa(conversaId)
            .subscribe({

                next: (resultado) => {

                    // Evita atualizar uma conversa que já foi trocada
                    if (
                        this.conversaId !== conversaId ||
                        carregamentoAtual !==
                        this.numeroCarregamentoConversa
                    ) {
                        return;
                    }

                    this.analiseIA = resultado;

                    this.carregandoAnaliseIA = false;

                    this.cd.detectChanges();
                },

                error: (erro) => {

                    // Evita atualizar uma conversa que já foi trocada
                    if (
                        this.conversaId !== conversaId ||
                        carregamentoAtual !==
                        this.numeroCarregamentoConversa
                    ) {
                        return;
                    }

                    console.error(
                        '[Análise IA] Erro:',
                        erro
                    );

                    this.analiseIA = null;

                    this.carregandoAnaliseIA = false;

                    this.erroAnaliseIA = true;

                    this.cd.detectChanges();
                }

            });
    }

    enviarMensagem(): void {

        if (!this.conversaId) {
            return;
        }


        if (!this.conversa) {
            return;
        }


        if (
            !this.conversa.dentroJanela24h
        ) {

            this.notify.warn(
                'A janela de atendimento de 24 horas foi encerrada. Envie um template aprovado pelo WhatsApp.'
            );

            return;
        }

        if (
            !this.mensagem ||
            !this.mensagem.trim()
        ) {
            return;
        }


        if (this.enviando) {
            return;
        }

        this.enviando = true;


        const input =
            new EnviarMensagemWhatsAppDto();


        input.conversaId =
            this.conversaId;


        input.mensagem =
            this.mensagem.trim();


        this._whatsAppService
            .enviarMensagem(input)
            .subscribe({

                next: () => {

                    this.mensagem = '';

                    this.enviando = false;

                    this.carregarMensagens(true);


                    this.cd.detectChanges();
                },


                error: () => {

                    this.enviando = false;

                    this.cd.detectChanges();
                }

            });
    }


    abrirTemplates(): void {

        if (!this.conversaId) {
            return;
        }


        this.exibindoTemplates = true;

        this.cd.detectChanges();
    }


    fecharTemplates(): void {

        this.exibindoTemplates = false;

        this.cd.detectChanges();
    }


    templateEnviado(): void {

        this.exibindoTemplates = false;

        this.carregarMensagens(true);


        this.cd.detectChanges();
    }


    formatarHora(
        dataHora: any
    ): string {

        if (!dataHora) {
            return '';
        }


        if (
            typeof dataHora.format ===
            'function'
        ) {

            return dataHora.format('HH:mm');
        }


        return '';
    }


    fechar(): void {

        if (
            this.busyCarregamentoConversa
        ) {

            abp.ui.clearBusy();

            this.busyCarregamentoConversa =
                false;
        }


        this.onClose.emit();
    }

}