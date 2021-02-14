import { Component } from '@angular/core';
import { MenuItem } from '@core/modelo/menu-item';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app-base';
  public companies: MenuItem[] = [
    { url: '/home', nombre: 'home' , mostrarAutenticado: false},
    { url: '/lugar-turistico', nombre: 'Lugares Turisticos', mostrarAutenticado: true},
    { url: '/paquete-turistico', nombre: 'Paquetes Turisticos', mostrarAutenticado: true },
    { url: '/reserva', nombre: 'Reservas', mostrarAutenticado: true},
    { url: '/reserva/consultar', nombre: 'Consultar reserva', mostrarAutenticado: false},
    { url: '/login', nombre: 'login', mostrarAutenticado: false}
  ];
}
