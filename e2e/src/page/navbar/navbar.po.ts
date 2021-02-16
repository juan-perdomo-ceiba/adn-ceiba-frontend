import { by, element } from 'protractor';

export class NavbarPage {
    linkHome = element(by.xpath('/html/body/app-root/app-navbar/nav/a[1]'));
    linkLugarTuristico = element(by.xpath('/html/body/app-root/app-navbar/nav/a[1]'));
    linkLogin = element(by.xpath('/html/body/app-root/app-navbar/nav/a[3]'));
    async clickBotonLugarTuristico() {
        await this.linkLugarTuristico.click();
    }
    async clickBotonLogin() {
        await this.linkLogin.click();
    }
}
