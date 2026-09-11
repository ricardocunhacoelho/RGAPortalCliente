import { NgModule } from '@angular/core';

import { PromocoesRoutingModule }
    from './promocoes-routing.module';

import { PromocoesComponent }
    from './promocoes.component';

import { NovaPromocaoComponent }
    from './nova-promocao/nova-promocao.component';


@NgModule({

    imports: [

        PromocoesRoutingModule,

        PromocoesComponent,

        NovaPromocaoComponent

    ]

})
export class PromocoesModule {}