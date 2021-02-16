import { by, element } from 'protractor';

export class LugarTuristicoPage {
    private linkCrearLugarTuristico = element(by.id('linkCrearLugarTuristico'));
    private inputNombre = element(by.id('nombreLugarTuristico'));
    private inputDescripcion = element(by.id('descripcionLugarTuristico'));
    private inputMunicipio = element(by.id('municipioLugaTuristico'));
    private inputDireccion = element(by.id('direccionLugarTuristico'));
    private buttonCrearLugarTuristico = element(by.id('crearLugarTuristicoForm'));
    private buttonEliminarDefault = element(by.id('buttonEliminarLugarTuristico'));

    private listaLugaresTuristicos = element.all(by.css('tbody.lugaresturisticos tr'));

    async clickBotonCrearLugarTuristico() {
        await this.linkCrearLugarTuristico.click();
    }

    async clickBotonCrearLugarTuristicoForm() {
        await this.buttonCrearLugarTuristico.click();
    }

    async clickBotonEliminarLugarTuristicoForm() {
        await this.buttonEliminarDefault.click();
    }
    
    async ingresarNombre(nombre) {
        await this.inputNombre.sendKeys(nombre);
    }

    async ingresarDescripcion(descripcion) {
        await this.inputDescripcion.sendKeys(descripcion);
    }

    async ingresarMunicipio(municipio) {
        await this.inputMunicipio.sendKeys(municipio);
        //this.inputMunicipio.$('[value="1"]').click();
    }

    async ingresarDireccion(direccion) {
        await this.inputDireccion.sendKeys(direccion);
    }

    async contarLugaresTuristicos() {
        return this.listaLugaresTuristicos.count();
    }
}
