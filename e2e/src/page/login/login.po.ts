import { by, element } from 'protractor';

export class LoginPage {
    private inputUsuario = element(by.id('usuarioLogin'));
    private inputClave = element(by.id('claveLogin'));
    private buttonLogin = element(by.id('buttonLogin'));


    async clickBotonLogin() {
        await this.buttonLogin.click();
    }

    async ingresarUsuario(usuario) {
        await this.inputUsuario.sendKeys(usuario);
    }

    async ingresarClave(clave) {
        await this.inputClave.sendKeys(clave);
    }
}
