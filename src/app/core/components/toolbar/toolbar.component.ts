import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeguridadService } from '@seguridad/shared/service/seguridad.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: 'toolbar.component.html',
  styles: [`:host {
    background-color: #106cc8;
    color: rgba(255, 255, 255, 0.87);
    display: block;
    height: 48px;
    padding: 0 16px;
  }

  h1 {
    display: inline;
    font-size: 20px;
    font-weight: normal;
    letter-spacing: 0.1px;
    line-height: 48px;
  }

  .more {
    float: right;
    margin-top: 5px;
    top: 10
  }
  
  .title {
    margin-right: 2%
  }
  `]
})
export class ToolbarComponent implements OnInit {

  public usuario;

  constructor(protected seguridadServices: SeguridadService, protected router: Router) { }

  ngOnInit() {
    this.usuario = this.seguridadServices.obtenerUsuario();
  }

  estaAutenticado(): boolean {
    return this.seguridadServices.obtenerUsuario();
  }

  cerrarSesion() {
    this.seguridadServices.cerrarSesion();
    this.router.navigateByUrl('/home');
  }

}
