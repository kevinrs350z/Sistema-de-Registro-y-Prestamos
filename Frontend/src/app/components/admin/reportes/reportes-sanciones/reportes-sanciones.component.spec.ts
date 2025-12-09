import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesSancionesComponent } from './reportes-sanciones.component';

describe('ReportesSancionesComponent', () => {
  let component: ReportesSancionesComponent;
  let fixture: ComponentFixture<ReportesSancionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesSancionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesSancionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
