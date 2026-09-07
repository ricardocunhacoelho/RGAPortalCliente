import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OportunidadesComponent } from './oportunidades.component';

const routes: Routes = [
    {
        path: '',
        component: OportunidadesComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class OportunidadesRoutingModule {}