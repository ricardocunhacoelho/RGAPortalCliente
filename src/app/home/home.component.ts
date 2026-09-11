import {
    Component,
    Injector,
    ChangeDetectionStrategy,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { AppComponentBase }
    from '@shared/app-component-base';

import { appModuleAnimation }
    from '@shared/animations/routerTransition';

import {
    DashboardServiceProxy,
    DashboardDto,
    DashboardFunilDto,
    DashboardVendedorDto
} from '@shared/service-proxies/service-proxies';


@Component({

    templateUrl:
        './home.component.html',

    styleUrls: [
        './home.component.scss'
    ],

    animations: [
        appModuleAnimation()
    ],

    changeDetection:
        ChangeDetectionStrategy.OnPush,

    standalone: true,

    imports: [
        CommonModule
    ]

})
export class HomeComponent
    extends AppComponentBase
    implements OnInit {


    // ============================================================
    // DASHBOARD
    // ============================================================

    dashboard:
        DashboardDto | undefined;


    // ============================================================
    // LOADING
    // ============================================================

    carregando = false;


    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(
        injector: Injector,

        private _dashboardService:
            DashboardServiceProxy,

        private cd:
            ChangeDetectorRef

    ) {

        super(injector);

    }


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        this.carregarDashboard();

    }


    // ============================================================
    // CARREGAR DASHBOARD
    // ============================================================

    carregarDashboard(): void {

        this.carregando = true;

        this._dashboardService
            .obter()
            .subscribe({

                next: (result) => {

                    this.dashboard =
                        result;

                    this.carregando =
                        false;

                    this.cd.detectChanges();

                },

                error: () => {

                    this.carregando =
                        false;

                    this.notify.error(
                        'Não foi possível carregar o dashboard.'
                    );

                    this.cd.detectChanges();

                }

            });

    }


    // ============================================================
    // FUNIL
    // ============================================================

    getPercentualFunil(
        item: DashboardFunilDto
    ): number {

        if (!this.dashboard?.funil?.length) {
            return 0;
        }

        const maiorQuantidade =
            Math.max(
                ...this.dashboard.funil.map(
                    x => x.quantidade || 0
                )
            );

        if (!maiorQuantidade) {
            return 0;
        }

        return (
            (item.quantidade / maiorQuantidade) * 100
        );

    }


    // ============================================================
    // VALOR
    // ============================================================

    formatarValor(
        valor: number | undefined
    ): string {

        if (!valor) {
            return 'R$ 0';
        }

        return valor.toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
            }
        );

    }


    // ============================================================
    // STATUS DO FUNIL
    // ============================================================

    getClasseFunil(
        item: DashboardFunilDto
    ): string {

        if (item.ganho) {
            return 'ganho';
        }

        if (item.perdido) {
            return 'perdido';
        }

        return 'andamento';

    }


    // ============================================================
    // INICIAIS
    // ============================================================

    getIniciais(
        nome: string | undefined
    ): string {

        if (!nome) {
            return 'VD';
        }

        const partes =
            nome
                .trim()
                .split(' ')
                .filter(x => x);

        if (partes.length === 1) {
            return partes[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            partes[0][0] +
            partes[partes.length - 1][0]
        ).toUpperCase();

    }

}