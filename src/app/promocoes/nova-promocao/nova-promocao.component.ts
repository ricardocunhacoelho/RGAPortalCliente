import {
    ChangeDetectorRef,
    Component,
    Injector,
    OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponentBase }
    from '@shared/app-component-base';

import {
    ClientesServiceProxy,
    ClienteDto,
    ClienteDtoPagedResultDto,
    WhatsAppServiceProxy,
    WhatsAppTemplateDto,
    PromocoesServiceProxy,
    CriarPromocaoDto
} from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'app-nova-promocao',

    templateUrl:
        './nova-promocao.component.html',

    styleUrls: [
        './nova-promocao.component.scss'
    ],

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ]
})
export class NovaPromocaoComponent
    extends AppComponentBase
    implements OnInit {


    // ============================================================
    // PROMOÇÃO
    // ============================================================

    nomePromocao = '';


    // ============================================================
    // CLIENTES
    // ============================================================

    clientes: ClienteDto[] = [];

    clientesFiltrados: ClienteDto[] = [];

    clientesSelecionados: ClienteDto[] = [];

    pesquisaCliente = '';

    carregandoClientes = false;


    // ============================================================
    // TEMPLATES
    // ============================================================

    templates: WhatsAppTemplateDto[] = [];

    templateSelecionado:
        WhatsAppTemplateDto | null = null;

    carregandoTemplates = false;


    // ============================================================
    // PARÂMETROS DO TEMPLATE
    // ============================================================

    parametros: string[] = [];

    valorEstimadoProduto: number | undefined;


    // ============================================================
    // LOADING
    // ============================================================

    salvando = false;


    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(
        injector: Injector,

        private _clientesService:
            ClientesServiceProxy,

        private _whatsAppService:
            WhatsAppServiceProxy,

        private _promocoesService:
            PromocoesServiceProxy,

        private cd:
            ChangeDetectorRef
    ) {
        super(injector);
    }


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        this.carregarClientes();

        this.carregarTemplates();

    }


    // ============================================================
    // CLIENTES
    // ============================================================

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

                next: (
                    result: ClienteDtoPagedResultDto
                ) => {

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
     * Pesquisa clientes por:
     *
     * - Nome
     * - Empresa
     * - Telefone
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
            this.clientes.filter(
                cliente => {

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

                }
            );
    }


    /**
     * Seleciona ou remove um cliente.
     */
    alternarCliente(
        cliente: ClienteDto
    ): void {

        if (!cliente.id) {
            return;
        }


        if (!cliente.telefone) {

            this.notify.warn(
                `O cliente "${cliente.nome || cliente.empresa}" não possui telefone cadastrado.`
            );

            return;
        }


        const indice =
            this.clientesSelecionados.findIndex(
                x => x.id === cliente.id
            );


        if (indice >= 0) {

            this.clientesSelecionados.splice(
                indice,
                1
            );

        } else {

            this.clientesSelecionados.push(
                cliente
            );

        }


        /*
         * Atualiza o parâmetro automático
         * do preview.
         */
        this.atualizarParametroCliente();

        this.cd.detectChanges();
    }


    /**
     * Verifica se o cliente está selecionado.
     */
    isClienteSelecionado(
        cliente: ClienteDto
    ): boolean {

        if (!cliente.id) {
            return false;
        }


        return this.clientesSelecionados
            .some(
                x => x.id === cliente.id
            );
    }


    /**
     * Seleciona todos os clientes
     * atualmente filtrados.
     */
    selecionarTodos(): void {

        const clientesComTelefone =
            this.clientesFiltrados
                .filter(x => !!x.telefone);


        const todosSelecionados =
            clientesComTelefone.length > 0 &&
            clientesComTelefone.every(
                cliente =>
                    this.isClienteSelecionado(cliente)
            );


        if (todosSelecionados) {

            /*
             * Remove os clientes filtrados.
             */
            this.clientesSelecionados =
                this.clientesSelecionados.filter(
                    selecionado =>
                        !this.clientesFiltrados.some(
                            filtrado =>
                                filtrado.id === selecionado.id
                        )
                );

        } else {

            /*
             * Adiciona os clientes filtrados
             * que possuem telefone.
             */
            clientesComTelefone
                .forEach(cliente => {

                    if (!this.isClienteSelecionado(cliente)) {

                        this.clientesSelecionados.push(
                            cliente
                        );

                    }

                });

        }


        this.atualizarParametroCliente();

        this.cd.detectChanges();
    }


    /**
     * Retorna se todos os clientes filtrados
     * com telefone estão selecionados.
     */
    get todosFiltradosSelecionados(): boolean {

        const clientesComTelefone =
            this.clientesFiltrados
                .filter(x => !!x.telefone);


        if (!clientesComTelefone.length) {
            return false;
        }


        return clientesComTelefone.every(
            cliente =>
                this.isClienteSelecionado(cliente)
        );
    }


    /**
     * Quantidade de clientes selecionados.
     */
    get quantidadeClientesSelecionados(): number {

        return this.clientesSelecionados.length;

    }


    // ============================================================
    // TEMPLATES
    // ============================================================

    /**
     * Carrega os templates do WhatsApp.
     */
    carregarTemplates(): void {

        this.carregandoTemplates = true;

        this._whatsAppService
            .obterTemplates()
            .subscribe({

                next: (result) => {

                    this.templates =
                        result || [];

                    this.carregandoTemplates =
                        false;


                    /*
                     * Seleciona automaticamente
                     * o template de promoção.
                     */
                    const promocao =
                        this.templates.find(
                            x =>
                                x.nome ===
                                'promocao_produto'
                        );


                    if (promocao) {

                        this.selecionarTemplate(
                            promocao
                        );

                    } else if (
                        this.templates.length > 0
                    ) {

                        this.selecionarTemplate(
                            this.templates[0]
                        );

                    }


                    this.cd.detectChanges();
                },

                error: () => {

                    this.carregandoTemplates =
                        false;

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


        this.cd.detectChanges();
    }


    // ============================================================
    // PARÂMETROS
    // ============================================================

    /**
     * Cria os campos dos parâmetros
     * do template selecionado.
     */
    criarParametros(): void {

        if (!this.templateSelecionado) {

            this.parametros = [];

            return;
        }


        const quantidade =
            this.templateSelecionado
                .quantidadeParametros || 0;


        this.parametros =
            new Array(quantidade).fill('');


        /*
         * Se o primeiro parâmetro for
         * o nome do cliente, ele será
         * preenchido automaticamente.
         */
        this.atualizarParametroCliente();


        this.cd.detectChanges();
    }


    /**
     * Atualiza o parâmetro automático
     * com o primeiro cliente selecionado.
     */
    atualizarParametroCliente(): void {

        if (!this.templateSelecionado) {
            return;
        }


        if (
            !this.parametros ||
            this.parametros.length === 0
        ) {
            return;
        }


        if (!this.parametroAutomatico(0)) {
            return;
        }


        this.parametros[0] =
            this.nomeClientePreview;
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
            this.templateSelecionado
                .nomesParametros || [];


        return (
            nomes[index] ||
            `Parâmetro ${index + 1}`
        );
    }


    /**
     * Retorna o valor de um parâmetro.
     */
    getParametro(
        index: number
    ): string {

        return this.parametros[index] || '';
    }


    /**
     * Altera o valor de um parâmetro.
     */
    alterarParametro(
        index: number,
        valor: string
    ): void {

        this.parametros[index] =
            valor;
    }


    /**
     * Verifica se o parâmetro deve ser
     * preenchido automaticamente.
     *
     * O primeiro parâmetro, quando for
     * o nome do cliente, é automático.
     */
    parametroAutomatico(
        index: number
    ): boolean {

        if (index !== 0) {
            return false;
        }


        if (!this.templateSelecionado) {
            return false;
        }


        const nome =
            this.obterNomeParametro(index)
                .toLowerCase();


        return (
            nome.includes('cliente') ||
            nome.includes('nome do cliente')
        );
    }


    /**
     * Retorna a quantidade de parâmetros.
     */
    obterQuantidadeParametros(): number {

        if (!this.templateSelecionado) {
            return 0;
        }


        return (
            this.templateSelecionado
                .quantidadeParametros || 0
        );
    }


    /**
     * Retorna os índices dos parâmetros.
     */
    obterIndicesParametros(): number[] {

        const quantidade =
            this.obterQuantidadeParametros();


        return Array.from(
            { length: quantidade },
            (_, index) => index
        );
    }


    /**
     * Verifica se todos os parâmetros
     * necessários foram preenchidos.
     */
    parametrosValidos(): boolean {

        if (!this.templateSelecionado) {
            return false;
        }


        const quantidade =
            this.templateSelecionado
                .quantidadeParametros || 0;


        if (!quantidade) {
            return true;
        }


        for (
            let i = 0;
            i < quantidade;
            i++
        ) {

            if (this.parametroAutomatico(i)) {
                continue;
            }


            const valor =
                this.parametros[i];


            if (
                !valor ||
                !valor.trim()
            ) {

                return false;

            }

        }


        return true;
    }


    // ============================================================
    // PREVIEW
    // ============================================================

    /**
     * Nome usado no preview.
     *
     * Como existem vários clientes,
     * mostramos o primeiro selecionado
     * como exemplo.
     */
    get nomeClientePreview(): string {

        if (
            this.clientesSelecionados.length > 0
        ) {

            return (
                this.clientesSelecionados[0].nome ||
                this.clientesSelecionados[0].empresa ||
                'Nome do cliente'
            );

        }


        return 'Nome do cliente';
    }


    /**
     * Monta o texto da mensagem substituindo
     * {{1}}, {{2}}, etc.
     */
    get mensagemPreview(): string {

        if (!this.templateSelecionado) {
            return '';
        }


        let texto =
            this.templateSelecionado.corpo || '';


        for (
            let i = 0;
            i <
            this.templateSelecionado
                .quantidadeParametros;
            i++
        ) {

            let valor =
                this.parametros[i] || '';


            /*
             * Se for o primeiro parâmetro
             * e ele representar o cliente,
             * usamos o cliente selecionado.
             */
            if (
                i === 0 &&
                this.parametroAutomatico(i)
            ) {

                valor =
                    this.nomeClientePreview;

            }


            /*
             * Caso o usuário ainda não tenha
             * preenchido o parâmetro manual,
             * mostramos o próprio marcador.
             */
            if (!valor.trim()) {

                valor =
                    `{{${i + 1}}}`;

            }


            texto =
                texto.replace(
                    new RegExp(
                        `\\{\\{${i + 1}\\}\\}`,
                        'g'
                    ),
                    valor
                );

        }


        return texto;
    }


    // ============================================================
    // CRIAR PROMOÇÃO
    // ============================================================

    criarPromocao(): void {

        if (this.salvando) {
            return;
        }


        // --------------------------------------------------------
        // VALIDAÇÕES
        // --------------------------------------------------------

        if (!this.nomePromocao.trim()) {

            this.notify.warn(
                'Informe o nome da promoção.'
            );

            return;
        }


        if (!this.templateSelecionado) {

            this.notify.warn(
                'Selecione um template.'
            );

            return;
        }


        if (
            this.clientesSelecionados.length === 0
        ) {

            this.notify.warn(
                'Selecione pelo menos um cliente.'
            );

            return;
        }


        if (!this.parametrosValidos()) {

            this.notify.warn(
                'Preencha os parâmetros da promoção.'
            );

            return;
        }


        // --------------------------------------------------------
        // MONTA O DTO
        // --------------------------------------------------------

        const input =
            new CriarPromocaoDto();


        input.nome =
            this.nomePromocao.trim();


        input.templateId =
            this.templateSelecionado.nome;


        input.clienteIds =
            this.clientesSelecionados
                .map(cliente => cliente.id)
                .filter(
                    (id): id is string =>
                        !!id
                );


        /*
         * O backend precisa armazenar o nome
         * do produto porque o BackgroundJob
         * utilizará esse valor como parâmetro 2.
         *
         * Para o template promocao_produto:
         *
         * {{1}} = Nome do cliente
         * {{2}} = Nome do produto
         */
        if (this.templateSelecionado.nome === 'promocao_produto') {
            input.nomeProduto =
                this.parametros[1]
                    ? this.parametros[1].trim()
                    : undefined;
        } else {
            input.nomeProduto = undefined;
        }

        input.valorEstimadoProduto =
            this.valorEstimadoProduto;
            
        // --------------------------------------------------------
        // ENVIA PARA O BACKEND
        // --------------------------------------------------------

        this.salvando = true;


        this._promocoesService
            .criar(input)
            .subscribe({

                next: (promocao) => {

                    this.salvando = false;


                    this.notify.success(
                        'Promoção criada com sucesso. O envio será processado em segundo plano.'
                    );


                    this.cd.detectChanges();


                    /*
                     * Volta para a tela anterior
                     * depois que o backend aceitou
                     * a promoção.
                     */
                    window.history.back();
                },

                error: (error) => {

                    this.salvando = false;


                    const mensagem =
                        error?.error?.error?.message ||
                        error?.error?.message ||
                        'Não foi possível criar a promoção.';


                    this.notify.error(
                        mensagem
                    );


                    this.cd.detectChanges();
                }

            });
    }


    // ============================================================
    // CANCELAR
    // ============================================================

    cancelar(): void {

        if (this.salvando) {
            return;
        }


        window.history.back();
    }

}