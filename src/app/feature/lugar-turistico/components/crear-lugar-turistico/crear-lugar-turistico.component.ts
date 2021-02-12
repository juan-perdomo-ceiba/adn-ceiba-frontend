import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LugarTuristicoService } from '@lugar-turistico/shared/service/lugar-turistico.service';
import { Observable } from 'rxjs';
import { MunicipioService } from '@municipio/shared/service/municipio.service';
import { Municipio } from '@municipio/shared/model/municipio';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-crear-lugar-turistico',
  templateUrl: './crear-lugar-turistico.component.html',
  styleUrls: ['./crear-lugar-turistico.component.css']
})
export class CrearLugarTuristicoComponent implements OnInit {
  public lugarTuristicoForm: FormGroup;
  public $municipios: Observable<Municipio[]>; 
  public idLugarTuristico;
  constructor(protected lugarTuristicoServices: LugarTuristicoService, protected municipioServices: MunicipioService, private router: Router, private activeRoute: ActivatedRoute) { }

  ngOnInit() {
    this.construirFormularioLugarTuristico();
    this.$municipios = this.municipioServices.consultar();

    this.idLugarTuristico = this.activeRoute.snapshot.paramMap.get('id');
    if(this.idLugarTuristico) {
      this.cargarLugarTuristicoEditar(this.idLugarTuristico);
    }
  }

  public crearActualizar(): void {
    if(this.idLugarTuristico) {
      let lugarTuristico = this.lugarTuristicoForm.value;
      lugarTuristico.id = this.idLugarTuristico;
      this.lugarTuristicoServices.editar(this.lugarTuristicoForm.value).subscribe(() => this.router.navigateByUrl('lugar-turistico/listar'));
      return;
    }
    this.lugarTuristicoServices.guardar(this.lugarTuristicoForm.value).subscribe(() => this.router.navigateByUrl('lugar-turistico/listar'));
  }

  private construirFormularioLugarTuristico() {
    this.lugarTuristicoForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      descripcion: new FormControl('', [Validators.required]),
      direccion: new FormControl('', [Validators.required]),
      idMunicipio: new FormControl('', [Validators.required])                                                      
    });
  }

  private cargarLugarTuristicoEditar(id) {
    this.lugarTuristicoServices.consultarPorId(id).subscribe(response => {
      this.lugarTuristicoForm.controls['nombre'].setValue(response.nombre);
      this.lugarTuristicoForm.controls['descripcion'].setValue(response.descripcion);
      this.lugarTuristicoForm.controls['direccion'].setValue(response.direccion),
      this.lugarTuristicoForm.controls['idMunicipio'].setValue(response.idMunicipio);
    });
  }

}
