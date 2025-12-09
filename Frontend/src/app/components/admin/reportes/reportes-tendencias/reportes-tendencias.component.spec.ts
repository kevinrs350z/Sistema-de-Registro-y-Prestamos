import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesTendenciasComponent } from './reportes-tendencias.component';

describe('ReportesTendenciasComponent', () => {
  let component: ReportesTendenciasComponent;
  let fixture: ComponentFixture<ReportesTendenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesTendenciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesTendenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
