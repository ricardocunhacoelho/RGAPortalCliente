import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConversasComponent } from './conversas.component';

const routes: Routes = [
    {
        path: '',
        component: ConversasComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConversasRoutingModule {
}