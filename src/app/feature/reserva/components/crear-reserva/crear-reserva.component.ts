import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LugarTuristicoService } from '@lugar-turistico/shared/service/lugar-turistico.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LugarTuristico } from '@lugar-turistico/shared/model/lugar-turistico';
import { PaqueteTuristicoService } from '@paquete-turistico/shared/service/paquete-turistico.service';

const LONGITUD_MINIMA_PERMITIDA_TEXTO = 3;
const LONGITUD_MAXIMA_PERMITIDA_TEXTO = 20;

@Component({
  selector: 'app-crear-reserva',
  templateUrl: './crear-reserva.component.html',
  styleUrls: ['./crear-reserva.component.css']
})
export class CrearReservaComponent implements OnInit {
  public paqueteTuristicoForm: FormGroup;
  public $lugaresTuristicos: Observable<LugarTuristico[]>; 

  constructor(protected lugarTuristicoServices: LugarTuristicoService, protected router: Router, protected paqueteTuristicoServices: PaqueteTuristicoService) { }

  ngOnInit() {
    this.construirFormularioProducto();
    this.$lugaresTuristicos = this.lugarTuristicoServices.consultar();
  }

  crear() {
    this.paqueteTuristicoServices.guardar(this.paqueteTuristicoForm.value).subscribe(
      () => this.router.navigateByUrl('reserva/listar')
    );
  }

  private construirFormularioProducto() {
    this.paqueteTuristicoForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      descripcion: new FormControl('', [Validators.required, Validators.minLength(LONGITUD_MINIMA_PERMITIDA_TEXTO),
                                                             Validators.maxLength(LONGITUD_MAXIMA_PERMITIDA_TEXTO)]),
      cantidadMaximaPersonas: new FormControl('', [Validators.required]),
      cantidadMaximaReservas: new FormControl('', [Validators.required]),
      precioPorPersona: new FormControl('', [Validators.required]),
      idLugarTuristico: new FormControl('', [Validators.required])                                                      
    });
  }

}
