import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesAlumnosComponent } from './reportes-alumnos.component';

describe('ReportesAlumnosComponent', () => {
  let component: ReportesAlumnosComponent;
  let fixture: ComponentFixture<ReportesAlumnosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesAlumnosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesAlumnosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
