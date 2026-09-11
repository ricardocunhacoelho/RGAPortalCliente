import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PromocoesComponent } from './promocoes.component';
import { NovaPromocaoComponent } from './nova-promocao/nova-promocao.component';

const routes: Routes = [
    {
        path: '',
        component: PromocoesComponent
    },
    {
        path: 'nova',
        component: NovaPromocaoComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class PromocoesRoutingModule {}