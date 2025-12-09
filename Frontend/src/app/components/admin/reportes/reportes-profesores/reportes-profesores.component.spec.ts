import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesProfesoresComponent } from './reportes-profesores.component';

describe('ReportesProfesoresComponent', () => {
  let component: ReportesProfesoresComponent;
  let fixture: ComponentFixture<ReportesProfesoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesProfesoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesProfesoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
