import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesConfigComponent } from './reportes.config.component';

describe('ReportesConfigComponent', () => {
  let component: ReportesConfigComponent;
  let fixture: ComponentFixture<ReportesConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
