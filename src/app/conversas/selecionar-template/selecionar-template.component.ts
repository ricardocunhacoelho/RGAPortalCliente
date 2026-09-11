import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Injector,
    Input,
    OnInit,
    Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import {
    ConversaDto,
    EnviarTemplateWhatsAppDto,
    WhatsAppServiceProxy,
    WhatsAppTemplateDto
} from '../../../shared/service-proxies/service-proxies';
import { AppComponentBase } from '../../../shared/app-component-base';


@Component({
    selector: 'app-selecionar-template',

    templateUrl: './selecionar-template.component.html',

    styleUrls: ['./selecionar-template.component.scss'],

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ]
})
export class SelecionarTemplateComponent
    extends AppComponentBase
    implements OnInit {

    @Input()
    conversaId: string | null = null;

    @Input()
    conversa: ConversaDto | null = null;

    @Output()
    onClose = new EventEmitter<void>();

    @Output()
    onEnviado = new EventEmitter<void>();


    templates: WhatsAppTemplateDto[] = [];

    templateSelecionado: WhatsAppTemplateDto | null = null;


    parametros: string[] = [];


    carregandoTemplates = false;

    enviando = false;


    constructor(
        injector: Injector,

        private _whatsAppService:
            WhatsAppServiceProxy,

        private cd:
            ChangeDetectorRef
    ) {
        super(injector);
    }


    ngOnInit(): void {

        this.carregarTemplates();

    }


    /**
     * Carrega os templates disponíveis no backend.
     */
    carregarTemplates(): void {

        this.carregandoTemplates = true;

        this._whatsAppService
            .obterTemplates()
            .subscribe({

                next: (result) => {

                    this.templates =
                        result || [];

                    this.carregandoTemplates = false;

                    this.cd.detectChanges();
                },

                error: () => {

                    this.carregandoTemplates = false;

                    this.notify.error(
                        'Não foi possível carregar os templates.'
                    );

                    this.cd.detectChanges();
                }

            });
    }


    /**
     * Seleciona um template.
     */
    selecionarTemplate(
        template: WhatsAppTemplateDto
    ): void {

        this.templateSelecionado =
            template;

        this.criarParametros();

    }


    /**
     * Cria os campos dos parâmetros
     * existentes no template.
     */
    criarParametros(): void {

        if (!this.templateSelecionado) {

            this.parametros = [];

            return;
        }


        const quantidade =
            this.templateSelecionado.quantidadeParametros || 0;


        this.parametros =
            new Array(quantidade).fill('');


        /*
         * Primeiro parâmetro:
         *
         * Normalmente é o nome do cliente.
         *
         * Preenche automaticamente quando
         * houver nome na conversa.
         */
        if (
            quantidade >= 1 &&
            this.conversa &&
            this.conversa.clienteNome
        ) {

            this.parametros[0] =
                this.conversa.clienteNome;
        }


        this.cd.detectChanges();
    }


    /**
     * Retorna o texto de um parâmetro.
     */
    getParametro(
        index: number
    ): string {

        return this.parametros[index] || '';
    }


    /**
     * Atualiza o valor de um parâmetro.
     */
    alterarParametro(
        index: number,
        valor: string
    ): void {

        this.parametros[index] =
            valor;
    }


    /**
     * Verifica se todos os parâmetros
     * obrigatórios foram preenchidos.
     */
    parametrosValidos(): boolean {

        if (!this.templateSelecionado) {
            return false;
        }


        if (
            !this.templateSelecionado.quantidadeParametros
        ) {
            return true;
        }


        return this.parametros.every(
            parametro =>
                !!parametro &&
                parametro.trim().length > 0
        );
    }


    /**
     * Substitui {{1}}, {{2}}, {{3}...
     * pelos valores informados.
     */
    obterPreview(): string {

        if (!this.templateSelecionado) {
            return '';
        }


        let texto =
            this.templateSelecionado.corpo || '';


        this.parametros.forEach(
            (parametro, index) => {

                const numero =
                    index + 1;

                const marcador =
                    `{{${numero}}}`;


                texto =
                    texto.split(marcador)
                        .join(
                            parametro || marcador
                        );
            }
        );


        return texto;
    }


    /**
     * Envia o template através do backend.
     */
    enviar(): void {

        if (this.enviando) {
            return;
        }


        if (!this.conversaId) {

            this.notify.warn(
                'A conversa não foi identificada.'
            );

            return;
        }


        if (!this.templateSelecionado) {

            this.notify.warn(
                'Selecione um template.'
            );

            return;
        }


        if (!this.parametrosValidos()) {

            this.notify.warn(
                'Preencha todos os parâmetros do template.'
            );

            return;
        }


        this.enviando = true;


        const input =
            new EnviarTemplateWhatsAppDto();


        input.conversaId =
            this.conversaId;


        input.nomeTemplate =
            this.templateSelecionado.nome;


        input.idioma =
            this.templateSelecionado.idioma;


        input.parametros =
            this.parametros.map(
                parametro =>
                    parametro.trim()
            );


        this._whatsAppService
            .enviarTemplate(input)
            .subscribe({

                next: () => {

                    this.enviando = false;

                    this.notify.success(
                        'Template enviado com sucesso.'
                    );


                    this.onEnviado.emit();


                    this.cd.detectChanges();
                },

                error: () => {

                    this.enviando = false;

                    this.cd.detectChanges();
                }

            });
    }


    /**
     * Fecha o componente.
     */
    fechar(): void {

        if (this.enviando) {
            return;
        }

        this.onClose.emit();
    }


    /**
     * Retorna o nome amigável do parâmetro.
     */
    obterNomeParametro(
        index: number
    ): string {

        if (!this.templateSelecionado) {
            return `Parâmetro ${index + 1}`;
        }

        const nomes =
            this.templateSelecionado.nomesParametros || [];

        return nomes[index] ||
            `Parâmetro ${index + 1}`;
    }


    /**
     * Retorna a quantidade de parâmetros.
     */
    obterQuantidadeParametros(): number {

        if (!this.templateSelecionado) {
            return 0;
        }

        return this.templateSelecionado
            .quantidadeParametros || 0;
    }


    /**
     * Retorna os parâmetros para o *ngFor.
     */
    obterIndicesParametros(): number[] {

        const quantidade =
            this.obterQuantidadeParametros();

        return Array.from(
            { length: quantidade },
            (_, index) => index
        );
    }

}