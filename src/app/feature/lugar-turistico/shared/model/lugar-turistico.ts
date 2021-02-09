export class LugarTuristico {
    id: string;
    nombre: string;
    descripcion: string;
    direccion: string;

    constructor(id: string, descripcion: string) {
        this.id = id;
        this.descripcion = descripcion;
    }
}
