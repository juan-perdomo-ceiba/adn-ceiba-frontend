import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { SeguridadService } from "../../shared/service/seguridad.service";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
  })
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    constructor(protected seguridadServices: SeguridadService, protected router: Router) { }
  
    ngOnInit() {
      this.construirFormularioProducto();
    }
  
    private construirFormularioProducto() {
      this.loginForm = new FormGroup({
        usuario: new FormControl('', [Validators.required]),
        clave: new FormControl('', [Validators.required])
      });
    }

    login() {
      this.seguridadServices.login(this.loginForm.value).subscribe(response => {
        this.seguridadServices.guardarSesion(response);
        this.router.navigateByUrl('/lugar-turistico')
      })
    }
}