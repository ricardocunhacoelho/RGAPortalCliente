import {
    ChangeDetectorRef,
    Component,
    Injector,
    OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { AppComponentBase }
    from '@shared/app-component-base';

import {
    PromocoesServiceProxy,
    PromocaoDto
} from '@shared/service-proxies/service-proxies';


@Component({
    selector: 'app-promocoes',

    templateUrl:
        './promocoes.component.html',

    styleUrls: [
        './promocoes.component.scss'
    ],

    standalone: true,

    imports: [
        CommonModule,
        FormsModule
    ]
})
export class PromocoesComponent
    extends AppComponentBase
    implements OnInit {


    // ============================================================
    // DADOS
    // ============================================================

    promocoes: PromocaoDto[] = [];


    // ============================================================
    // LOADING
    // ============================================================

    carregando = false;


    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor(
        injector: Injector,

        private _promocoesService:
            PromocoesServiceProxy,

        private router:
            Router,

        private cd:
            ChangeDetectorRef
    ) {
        super(injector);
    }


    // ============================================================
    // INIT
    // ============================================================

    ngOnInit(): void {

        this.carregarPromocoes();

    }


    // ============================================================
    // CARREGAR PROMOÇÕES
    // ============================================================

    carregarPromocoes(): void {

        this.carregando = true;

        this._promocoesService
            .obterTodas()
            .subscribe({

                next: (result) => {

                    this.promocoes =
                        result || [];

                    this.carregando =
                        false;

                    this.cd.detectChanges();
                },

                error: () => {

                    this.carregando =
                        false;

                    this.notify.error(
                        'Não foi possível carregar as promoções.'
                    );

                    this.cd.detectChanges();
                }

            });
    }


    // ============================================================
    // NOVA PROMOÇÃO
    // ============================================================

    novaPromocao(): void {

        this.router.navigate([
            '/app/promocoes/nova'
        ]);

    }


    // ============================================================
    // ABRIR PROMOÇÃO
    // ============================================================

    abrirPromocao(
        promocao: PromocaoDto
    ): void {

        if (!promocao) {
            return;
        }

        /*
         * Depois vamos criar a tela de detalhes
         * da promoção.
         *
         * Por enquanto não existe edição.
         */

    }

    formatarData(data: moment.Moment | undefined): string {
        if (!data) {
            return '-';
        }

        return data.format('DD/MM/YYYY HH:mm');
    }

}