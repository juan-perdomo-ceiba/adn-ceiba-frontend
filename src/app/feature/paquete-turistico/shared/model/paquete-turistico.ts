export class PaqueteTuristico {
    id: string;
    nombre: string;
    descripcion: string;
    cantidadMaximaPersonas: number;
    cantidadMaximaReservas: number;
    precioPorPersona: number;
    idLugarTuristico: number;

    constructor(id: string, descripcion: string) {
        this.id = id;
        this.descripcion = descripcion;
    }
}
