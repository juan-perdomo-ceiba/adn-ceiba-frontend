import { NavbarPage } from '../page/navbar/navbar.po';
import { AppPage } from '../app.po';
import { LugarTuristicoPage } from '../page/lugar-turistico/lugar-turistico.po';
import { LoginPage } from '../page/login/login.po';

describe('workspace-project Lugar turistico', () => {
    let page: AppPage;
    let navBar: NavbarPage;
    let lugarTuristico: LugarTuristicoPage;
    let login: LoginPage;

    beforeEach(() => {
        page = new AppPage();
        navBar = new NavbarPage();
        lugarTuristico = new LugarTuristicoPage();
        login = new LoginPage();
    });

    it('Deberia crear lugar turistico', () => {
        page.navigateTo();
        const USARIO = 'juan';
        const CLAVE = '12345';

        navBar.clickBotonLogin();
        login.ingresarUsuario(USARIO);
        login.ingresarClave(CLAVE);
        login.clickBotonLogin();

        const NOMBRE = 'Cafe filandia' + Math.random() * (100 - 1) + 1;
        const DESCRIPCION= 'Muy bueno el cafe';
        const DIRECCION = 'Calle 14 # 85';
        const MUNICIPIO = 'Armenia';

        navBar.clickBotonLugarTuristico();
        lugarTuristico.clickBotonCrearLugarTuristico();

        const cantidadLugaresAnterior = lugarTuristico.contarLugaresTuristicos();
        lugarTuristico.ingresarNombre(NOMBRE);
        lugarTuristico.ingresarDescripcion(DESCRIPCION);
        lugarTuristico.ingresarMunicipio(MUNICIPIO);
        lugarTuristico.ingresarDireccion(DIRECCION);
        lugarTuristico.clickBotonCrearLugarTuristicoForm();
        expect(lugarTuristico.contarLugaresTuristicos()).toBeGreaterThan(cantidadLugaresAnterior);
    });

    it('Deberia listar los lugares turisticos', async () => {
        const registrosExistentes = await lugarTuristico.contarLugaresTuristicos();
        expect(registrosExistentes).toBe(lugarTuristico.contarLugaresTuristicos());
        expect(registrosExistentes).toBeGreaterThan(0);
    });

    
    it('Deberia eliminar un lugar turistico', async () => {
        const cantidadLugaresAnterior = await lugarTuristico.contarLugaresTuristicos();
        lugarTuristico.clickBotonEliminarLugarTuristicoForm();
        expect(lugarTuristico.contarLugaresTuristicos()).toBeLessThan(cantidadLugaresAnterior);
    });
});
