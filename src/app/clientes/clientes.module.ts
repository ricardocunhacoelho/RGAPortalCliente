import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ClientesRoutingModule } from './clientes-routing.module';
import { ClientesComponent } from './clientes.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        ClientesRoutingModule,
        ClientesComponent,
    ],
})
export class ClientesModule {}