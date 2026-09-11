import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ConversasRoutingModule } from './conversas-routing.module';

import { ConversasComponent } from './conversas.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        ConversasRoutingModule,
        ConversasComponent
    ],
})
export class ConversasModule {}