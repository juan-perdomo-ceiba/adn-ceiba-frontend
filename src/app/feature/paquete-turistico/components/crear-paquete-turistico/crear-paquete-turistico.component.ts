import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LugarTuristicoService } from '@lugar-turistico/shared/service/lugar-turistico.service';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { LugarTuristico } from '@lugar-turistico/shared/model/lugar-turistico';
import { PaqueteTuristicoService } from '@paquete-turistico/shared/service/paquete-turistico.service';

@Component({
  selector: 'app-crear-paquete-turistico',
  templateUrl: './crear-paquete-turistico.component.html',
  styleUrls: ['./crear-paquete-turistico.component.css']
})
export class CrearPaqueteTuristicoComponent implements OnInit {
  public paqueteTuristicoForm: FormGroup;
  public $lugaresTuristicos: Observable<LugarTuristico[]>; 
  public idPaqueteTuristico;

  constructor(protected lugarTuristicoServices: LugarTuristicoService, protected router: Router, protected paqueteTuristicoServices: PaqueteTuristicoService, private activeRoute: ActivatedRoute) { }

  ngOnInit() {
    this.construirFormularioCrearPaqueteTuristico();
    this.$lugaresTuristicos = this.lugarTuristicoServices.consultar();

    this.idPaqueteTuristico = this.activeRoute.snapshot.paramMap.get('id');
    if(this.idPaqueteTuristico) {
      this.cargarPaqueteTuristicoEditar(this.idPaqueteTuristico);
    }
  }

  crear() {
    if(this.idPaqueteTuristico) {
      let paqueteTuristico = this.paqueteTuristicoForm.value;
      paqueteTuristico.id = this.idPaqueteTuristico;
      this.paqueteTuristicoServices.editar(this.paqueteTuristicoForm.value).subscribe(() => this.router.navigateByUrl('paquete-turistico/listar'));
      return;
    }
    this.paqueteTuristicoServices.guardar(this.paqueteTuristicoForm.value).subscribe(
      () => this.router.navigateByUrl('paquete-turistico/listar')
    );
  }

  private construirFormularioCrearPaqueteTuristico() {
    this.paqueteTuristicoForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      descripcion: new FormControl('', [Validators.required]),
      cantidadMaximaPersonas: new FormControl('', [Validators.required]),
      cantidadMaximaReservas: new FormControl('', [Validators.required]),
      precioPorPersona: new FormControl('', [Validators.required]),
      idLugarTuristico: new FormControl('', [Validators.required])                                                      
    });
  }

  private cargarPaqueteTuristicoEditar(id) {
    this.paqueteTuristicoServices.consultarPorId(id).subscribe(response => {
      this.paqueteTuristicoForm.controls['nombre'].setValue(response.nombre);
      this.paqueteTuristicoForm.controls['descripcion'].setValue(response.descripcion);
      this.paqueteTuristicoForm.controls['cantidadMaximaPersonas'].setValue(response.cantidadMaximaPersonas),
      this.paqueteTuristicoForm.controls['cantidadMaximaReservas'].setValue(response.cantidadMaximaReservas);
      this.paqueteTuristicoForm.controls['precioPorPersona'].setValue(response.precioPorPersona);
      this.paqueteTuristicoForm.controls['idLugarTuristico'].setValue(response.idLugarTuristico);
    });
  }
}
