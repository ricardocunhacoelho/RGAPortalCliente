import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import {
    Router,
    RouterEvent,
    NavigationEnd,
    PRIMARY_OUTLET,
    RouterLink,
    RouterLinkActive
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuItem } from '@shared/layout/menu-item';
import { NgTemplateOutlet } from '@angular/common';
import { CollapseDirective } from 'ngx-bootstrap/collapse';

@Component({
    selector: 'sidebar-menu',
    templateUrl: './sidebar-menu.component.html',
    standalone: true,
    imports: [
        NgTemplateOutlet,
        RouterLink,
        RouterLinkActive,
        CollapseDirective
    ],
})
export class SidebarMenuComponent extends AppComponentBase implements OnInit {
    menuItems: MenuItem[] = [];
    menuItemsMap: { [key: number]: MenuItem } = {};
    activatedMenuItems: MenuItem[] = [];
    routerEvents: BehaviorSubject<RouterEvent | undefined> =
        new BehaviorSubject<RouterEvent | undefined>(undefined);
    homeRoute = '/app/home';

    constructor(
        injector: Injector,
        private router: Router
    ) {
        super(injector);
    }

    ngOnInit(): void {

        this.menuItems = this.getMenuItems();

        this.patchMenuItems(this.menuItems);


        // Ativa o item correspondente à rota atual
        this.atualizarMenuAtivo(this.router.url);


        // Atualiza quando houver navegação
        this.router.events
            .pipe(
                filter(
                    (event): event is NavigationEnd =>
                        event instanceof NavigationEnd
                )
            )
            .subscribe((event: NavigationEnd) => {

                this.atualizarMenuAtivo(event.urlAfterRedirects);

            });
    }

    private atualizarMenuAtivo(url: string): void {

        const currentUrl =
            url !== '/'
                ? url
                : this.homeRoute;


        const primaryUrlSegmentGroup =
            this.router
                .parseUrl(currentUrl)
                .root
                .children[PRIMARY_OUTLET];


        if (!primaryUrlSegmentGroup) {
            return;
        }


        const rota =
            '/' + primaryUrlSegmentGroup.toString();


        this.activateMenuItems(rota);
    }

    getMenuItems(): MenuItem[] {
        return [
            new MenuItem(
                this.l('HomePage'),
                '/app/home',
                'fas fa-home'
            ),

            new MenuItem(
                'Oportunidades',
                '/app/oportunidades',
                'fas fa-handshake'
            ),

            new MenuItem(
                'Conversas',
                '/app/conversas',
                'fab fa-whatsapp'
            ),

            new MenuItem(
                'Promoções',
                '/app/promocoes',
                'fas fa-bullhorn'
            ),

            new MenuItem(
                'Clientes',
                '/app/clientes',
                'fas fa-users'
            ),

            new MenuItem(
                this.l('Roles'),
                '/app/roles',
                'fas fa-theater-masks',
                'Pages.Roles'
            ),

            new MenuItem(
                this.l('Tenants'),
                '/app/tenants',
                'fas fa-building',
                'Pages.Tenants'
            ),

            new MenuItem(
                this.l('Users'),
                '/app/users',
                'fas fa-users',
                'Pages.Users'
            ),
        ];
    }

    patchMenuItems(items: MenuItem[], parentId?: number): void {
        items.forEach((item: MenuItem, index: number) => {
            item.id = parentId ? Number(parentId + '' + (index + 1)) : index + 1;
            if (parentId) {
                item.parentId = parentId;
            }
            if (parentId || item.children) {
                this.menuItemsMap[item.id] = item;
            }
            if (item.children) {
                this.patchMenuItems(item.children, item.id);
            }
        });
    }

    activateMenuItems(url: string): void {

        this.deactivateMenuItems(this.menuItems);

        this.activatedMenuItems = [];


        const foundedItems =
            this.findMenuItemsByUrl(
                url,
                this.menuItems
            );


        foundedItems.forEach((item) => {

            this.activateMenuItem(item);

        });
    }

    deactivateMenuItems(items: MenuItem[]): void {
        items.forEach((item: MenuItem) => {
            item.isActive = false;
            item.isCollapsed = true;
            if (item.children) {
                this.deactivateMenuItems(item.children);
            }
        });
    }

    findMenuItemsByUrl(
        url: string,
        items: MenuItem[],
        foundedItems: MenuItem[] = []
    ): MenuItem[] {

        items.forEach((item: MenuItem) => {

            if (
                item.route &&
                (
                    item.route === url ||
                    url.startsWith(item.route + '/')
                )
            ) {

                foundedItems.push(item);

            }
            else if (item.children) {

                this.findMenuItemsByUrl(
                    url,
                    item.children,
                    foundedItems
                );

            }

        });

        return foundedItems;
    }

    activateMenuItem(item: MenuItem): void {
        item.isActive = true;
        if (item.children) {
            item.isCollapsed = false;
        }
        this.activatedMenuItems.push(item);
        if (item.parentId) {
            this.activateMenuItem(this.menuItemsMap[item.parentId]);
        }
    }

    isMenuItemVisible(item: MenuItem): boolean {
        if (!item.permissionName) {
            return true;
        }
        return this.permission.isGranted(item.permissionName);
    }
}
