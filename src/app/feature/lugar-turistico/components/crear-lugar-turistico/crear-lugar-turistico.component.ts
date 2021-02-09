import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LugarTuristicoService } from '@lugar-turistico/shared/service/lugar-turistico.service';

const LONGITUD_MINIMA_PERMITIDA_TEXTO = 3;
const LONGITUD_MAXIMA_PERMITIDA_TEXTO = 20;

@Component({
  selector: 'app-crear-lugar-turistico',
  templateUrl: './crear-lugar-turistico.component.html',
  styleUrls: ['./crear-lugar-turistico.component.css']
})
export class CrearLugarTuristicoComponent implements OnInit {
  lugarTuristicoForm: FormGroup;
  constructor(protected lugarTuristicoServices: LugarTuristicoService) { }

  ngOnInit() {
    this.construirFormularioProducto();
  }

  cerar() {
    this.lugarTuristicoServices.guardar(this.lugarTuristicoForm.value);
  }

  private construirFormularioProducto() {
    this.lugarTuristicoForm = new FormGroup({
      id: new FormControl('', [Validators.required]),
      descripcion: new FormControl('', [Validators.required, Validators.minLength(LONGITUD_MINIMA_PERMITIDA_TEXTO),
                                                             Validators.maxLength(LONGITUD_MAXIMA_PERMITIDA_TEXTO)]),
      direccion: new FormControl('', [Validators.required])                                                       
    });
  }

}
