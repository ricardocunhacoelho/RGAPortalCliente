import { NgModule } from '@angular/core';

import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AbpHttpInterceptor } from 'abp-ng2-module';

import * as ApiServiceProxies from './service-proxies';

@NgModule({

    providers: [

        ApiServiceProxies.RoleServiceProxy,
        ApiServiceProxies.SessionServiceProxy,
        ApiServiceProxies.TenantServiceProxy,
        ApiServiceProxies.UserServiceProxy,
        ApiServiceProxies.TokenAuthServiceProxy,
        ApiServiceProxies.AccountServiceProxy,
        ApiServiceProxies.ConfigurationServiceProxy,

        // CRM
        ApiServiceProxies.ClientesServiceProxy,
        ApiServiceProxies.VendedoresServiceProxy,
        ApiServiceProxies.StatusNegociacoesServiceProxy,
        ApiServiceProxies.OportunidadesServiceProxy,
        ApiServiceProxies.WhatsAppServiceProxy,
        ApiServiceProxies.ConversasServiceProxy,
        ApiServiceProxies.MensagensServiceProxy,
        ApiServiceProxies.AnalisesIAServiceProxy,
        ApiServiceProxies.PromocoesServiceProxy,
        ApiServiceProxies.DashboardServiceProxy,

        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true },
    ],

})

export class ServiceProxyModule {}