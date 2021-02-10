import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { LugarTuristicoService } from '@lugar-turistico/shared/service/lugar-turistico.service';
import { LugarTuristico } from '@lugar-turistico/shared/model/lugar-turistico';

@Component({
  selector: 'app-listar-lugar-turistico',
  templateUrl: './listar-lugar-turistico.component.html',
  styleUrls: ['./listar-lugar-turistico.component.css']
})
export class ListarLugarTuristicoComponent implements OnInit {
  public listaLugaresTuristicos: Observable<LugarTuristico[]>;

  constructor(protected lugarTuristico: LugarTuristicoService) { }

  ngOnInit() {
    this.cargarDatos();
  }

  public eliminar(lugarTuristico: LugarTuristico): void {
      this.lugarTuristico.eliminar(lugarTuristico).subscribe(() => this.cargarDatos());
  }

  private cargarDatos() {
    this.listaLugaresTuristicos = this.lugarTuristico.consultar();
  }
}
