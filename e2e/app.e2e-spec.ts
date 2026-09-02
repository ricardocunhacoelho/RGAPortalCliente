import { RGAPortalClienteTemplatePage } from './app.po';

describe('RGAPortalCliente App', function () {
    let page: RGAPortalClienteTemplatePage;

    beforeEach(() => {
        page = new RGAPortalClienteTemplatePage();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toEqual('app works!');
    });
});
