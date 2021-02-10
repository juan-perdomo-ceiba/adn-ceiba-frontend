import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LugarTuristicoService } from '@lugar-turistico/shared/service/lugar-turistico.service';
import { Observable } from 'rxjs';
import { MunicipioService } from '@municipio/shared/service/municipio.service';
import { Municipio } from '@municipio/shared/model/municipio';
import { Router } from '@angular/router';

const LONGITUD_MINIMA_PERMITIDA_TEXTO = 3;
const LONGITUD_MAXIMA_PERMITIDA_TEXTO = 20;

@Component({
  selector: 'app-crear-lugar-turistico',
  templateUrl: './crear-lugar-turistico.component.html',
  styleUrls: ['./crear-lugar-turistico.component.css']
})
export class CrearLugarTuristicoComponent implements OnInit {
  public lugarTuristicoForm: FormGroup;
  public $municipios: Observable<Municipio[]>; 

  constructor(protected lugarTuristicoServices: LugarTuristicoService, protected municipioServices: MunicipioService, private router: Router) { }

  ngOnInit() {
    this.construirFormularioProducto();
    this.$municipios = this.municipioServices.consultar();
  }

  cerar() {
    console.log(this.lugarTuristicoForm.value);
    this.lugarTuristicoServices.guardar(this.lugarTuristicoForm.value).subscribe(
      () => this.router.navigateByUrl('lugar-turistico/listar')
    );
  }

  private construirFormularioProducto() {
    this.lugarTuristicoForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      descripcion: new FormControl('', [Validators.required, Validators.minLength(LONGITUD_MINIMA_PERMITIDA_TEXTO),
                                                             Validators.maxLength(LONGITUD_MAXIMA_PERMITIDA_TEXTO)]),
      direccion: new FormControl('', [Validators.required]),
      idMunicipio: new FormControl('', [Validators.required])                                                      
    });
  }

}
