import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { PaqueteTuristicoService } from '@paquete-turistico/shared/service/paquete-turistico.service';
import { PaqueteTuristico } from '@paquete-turistico/shared/model/paquete-turistico';

@Component({
  selector: 'app-listar-paquete-turistico',
  templateUrl: './listar-paquete-turistico.component.html',
  styleUrls: ['./listar-paquete-turistico.component.css']
})
export class ListarPaqueteTuristicoComponent implements OnInit {
  public listaPaquetesTuristicos: Observable<PaqueteTuristico[]>;

  constructor(protected paqueteTuristicoServices: PaqueteTuristicoService) { }

  ngOnInit() {
    this.cargarDatos();
  }

  public eliminar(paqueteTuristico: PaqueteTuristico): void {
    this.paqueteTuristicoServices.eliminar(paqueteTuristico).subscribe(() => this.cargarDatos());
}

private cargarDatos() {
  this.listaPaquetesTuristicos = this.paqueteTuristicoServices.consultar();
}
}
