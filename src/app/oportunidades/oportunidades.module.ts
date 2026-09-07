import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { OportunidadesRoutingModule } from './oportunidades-routing.module';
import { OportunidadesComponent } from './oportunidades.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        OportunidadesRoutingModule,
        OportunidadesComponent,
    ],
})
export class OportunidadesModule {}