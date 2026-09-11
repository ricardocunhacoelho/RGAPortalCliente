import { Injectable } from '@angular/core';

import {
    HubConnection,
    HubConnectionBuilder,
    LogLevel
} from '@microsoft/signalr';

import { Subject } from 'rxjs';

import { AppConsts } from '@shared/AppConsts';
import { UtilsService } from 'abp-ng2-module';


@Injectable({
    providedIn: 'root'
})
export class WhatsAppSignalRService {

    private connection:
        HubConnection | null = null;

    private mensagemWhatsAppSubject =
        new Subject<any>();

    mensagemWhatsApp$ =
        this.mensagemWhatsAppSubject.asObservable();


    async conectar(): Promise<void> {

        // Já existe uma conexão
        if (this.connection) {
            return;
        }

        // ============================================================
        // TOKEN DE AUTENTICAÇÃO DO ABP
        // ============================================================

        const encryptedAuthToken =
            new UtilsService().getCookieValue(
                AppConsts.authorization.encryptedAuthTokenName
            );

        if (!encryptedAuthToken) {

            console.error(
                '[WhatsApp SignalR] Token de autenticação não encontrado.'
            );

            return;
        }

        // ============================================================
        // URL
        // ============================================================

        const url =
            AppConsts.remoteServiceBaseUrl +
            '/signalr-whatsapp';

        console.log(
            '[WhatsApp SignalR] Conectando em:',
            url
        );


        // ============================================================
        // CONEXÃO
        // ============================================================

        this.connection =
            new HubConnectionBuilder()
                .withUrl(
                    url +
                    '?enc_auth_token=' +
                    encodeURIComponent(
                        encryptedAuthToken
                    )
                )
                .configureLogging(
                    LogLevel.Information
                )
                .withAutomaticReconnect()
                .build();


        // ============================================================
        // EVENTO DE MENSAGEM
        // ============================================================

        this.connection.on(
            'MensagemWhatsAppAtualizada',
            (evento: any) => {

                console.log(
                    '[WhatsApp SignalR] MENSAGEM RECEBIDA:',
                    evento
                );

                this.mensagemWhatsAppSubject.next(
                    evento
                );
            }
        );


        // ============================================================
        // RECONEXÃO
        // ============================================================

        this.connection.onreconnecting(
            (erro) => {

                console.warn(
                    '[WhatsApp SignalR] Reconectando...',
                    erro
                );
            }
        );


        this.connection.onreconnected(
            (connectionId) => {

                console.log(
                    '[WhatsApp SignalR] Reconectado:',
                    connectionId
                );
            }
        );


        // ============================================================
        // CONEXÃO ENCERRADA
        // ============================================================

        this.connection.onclose(
            (erro) => {

                console.warn(
                    '[WhatsApp SignalR] Conexão encerrada.',
                    erro
                );

                this.connection = null;
            }
        );


        // ============================================================
        // INICIA CONEXÃO
        // ============================================================

        try {

            await this.connection.start();

            console.log(
                '[WhatsApp SignalR] CONECTADO.'
            );

        } catch (erro) {

            console.error(
                '[WhatsApp SignalR] Erro ao conectar:',
                erro
            );

            this.connection = null;
        }
    }
}