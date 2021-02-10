import { Component, OnInit } from '@angular/core';
import { PaqueteTuristico } from '@paquete-turistico/shared/model/paquete-turistico';
import { PaqueteTuristicoService } from '@paquete-turistico/shared/service/paquete-turistico.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  public $paquetesTuristicos: Observable<PaqueteTuristico[]>;


  constructor(protected paqueteTuristicoServices: PaqueteTuristicoService) { }

  ngOnInit() {
    this.$paquetesTuristicos = this.paqueteTuristicoServices.consultar();
  }

}
