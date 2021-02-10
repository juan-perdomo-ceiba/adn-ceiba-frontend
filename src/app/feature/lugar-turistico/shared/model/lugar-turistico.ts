export class LugarTuristico {
    id: string;
    nombre: string;
    descripcion: string;
    direccion: string;
    idMunicipio: number;

    constructor(id: string, descripcion: string) {
        this.id = id;
        this.descripcion = descripcion;
    }
}
