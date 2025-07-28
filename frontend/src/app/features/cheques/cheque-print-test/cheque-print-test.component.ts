import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { DEFAULT_CHEQUE_CONFIG, ChequePrintConfig } from '../../../core/config/cheque-print.config';

@Component({
  selector: 'app-cheque-print-test',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="test-container">
      <div class="test-header">
        <h1>Cheque Print Test</h1>
        <p>Use this tool to test and adjust field positioning for cheque printing</p>
      </div>

      <div class="test-controls">
        <div class="control-group">
          <label>Field:</label>
          <select [(ngModel)]="selectedField">
            <option value="date">Date</option>
            <option value="payee">Payee</option>
            <option value="amount">Amount</option>
            <option value="amountWords">Amount in Words</option>
          </select>
        </div>

        <div class="control-group" *ngIf="selectedField">
          <label>Top (mm):</label>
          <input type="number" [(ngModel)]="getFieldConfig().top" (input)="updateConfig()">
        </div>

        <div class="control-group" *ngIf="selectedField">
          <label>Left (mm):</label>
          <input type="number" [(ngModel)]="getFieldConfig().left" (input)="updateConfig()">
        </div>

        <div class="control-group" *ngIf="selectedField">
          <label>Font Size (px):</label>
          <input type="number" [(ngModel)]="getFieldConfig().fontSize" (input)="updateConfig()">
        </div>

        <div class="control-group" *ngIf="selectedField">
          <label>Width (mm):</label>
          <input type="number" [(ngModel)]="getFieldConfig().width" (input)="updateConfig()">
        </div>

        <div class="control-group" *ngIf="selectedField">
          <label>Text Align:</label>
          <select [(ngModel)]="getFieldConfig().textAlign" (change)="updateConfig()">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div class="cheque-preview">
        <div class="cheque-container" [style.width]="config.container.width" [style.height]="config.container.height">
          <div class="cheque-background"></div>
          
          <!-- Date Field -->
          <div class="field date-field" 
               [style.top]="config.fields.date.top"
               [style.left]="config.fields.date.left"
               [style.width]="config.fields.date.width"
               [style.font-size]="config.fields.date.fontSize"
               [style.text-align]="config.fields.date.textAlign">
            {{ testData.date }}
          </div>
          
          <!-- Payee Field -->
          <div class="field payee-field"
               [style.top]="config.fields.payee.top"
               [style.left]="config.fields.payee.left"
               [style.max-width]="config.fields.payee.maxWidth"
               [style.font-size]="config.fields.payee.fontSize"
               [style.text-align]="config.fields.payee.textAlign">
            {{ testData.payee }}
          </div>
          
          <!-- Amount Field -->
          <div class="field amount-field"
               [style.top]="config.fields.amount.top"
               [style.left]="config.fields.amount.left"
               [style.width]="config.fields.amount.width"
               [style.font-size]="config.fields.amount.fontSize"
               [style.text-align]="config.fields.amount.textAlign">
            {{ testData.amount }}
          </div>
          
          <!-- Amount Words Field -->
          <div class="field amount-words-field"
               [style.top]="config.fields.amountWords.top"
               [style.left]="config.fields.amountWords.left"
               [style.max-width]="config.fields.amountWords.maxWidth"
               [style.height]="config.fields.amountWords.height"
               [style.font-size]="config.fields.amountWords.fontSize"
               [style.line-height]="config.fields.amountWords.lineHeight"
               [style.text-align]="config.fields.amountWords.textAlign">
            {{ testData.amountWords }}
          </div>
        </div>
      </div>

      <div class="test-actions">
        <button (click)="exportConfig()">Export Configuration</button>
        <button (click)="resetConfig()">Reset to Default</button>
        <button (click)="printTest()">Print Test</button>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .test-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .test-header h1 {
      color: #333;
      margin-bottom: 10px;
    }

    .test-controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .control-group label {
      font-weight: 500;
      color: #333;
    }

    .control-group input,
    .control-group select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .cheque-preview {
      display: flex;
      justify-content: center;
      margin-bottom: 30px;
    }

    .cheque-container {
      position: relative;
      background: white;
      border: 2px solid #333;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .cheque-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('assets/cheaque.jpg');
      background-size: cover;
      background-position: center;
      opacity: 0.1;
    }

    .field {
      position: absolute;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #000;
      background: rgba(255, 255, 0, 0.2);
      border: 1px dashed #ff0000;
      padding: 2px;
    }

    .test-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .test-actions button {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .test-actions button:hover {
      background: #0056b3;
    }
  `]
})
export class ChequePrintTestComponent {
  config: ChequePrintConfig = JSON.parse(JSON.stringify(DEFAULT_CHEQUE_CONFIG));
  selectedField: string = 'date';

  testData = {
    date: '15/01/2024',
    payee: 'John Doe',
    amount: 'AED 1,000.00',
    amountWords: 'One Thousand Dirhams Only'
  };

  getFieldConfig() {
    switch (this.selectedField) {
      case 'date': return this.config.fields.date;
      case 'payee': return this.config.fields.payee;
      case 'amount': return this.config.fields.amount;
      case 'amountWords': return this.config.fields.amountWords;
      default: return this.config.fields.date;
    }
  }

  updateConfig() {
    // Configuration is automatically updated through two-way binding
    console.log('Updated config:', this.config);
  }

  exportConfig() {
    const configStr = JSON.stringify(this.config, null, 2);
    console.log('Configuration:', configStr);
    
    // Create download link
    const blob = new Blob([configStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cheque-config.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  resetConfig() {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CHEQUE_CONFIG));
  }

  printTest() {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cheque Print Test</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .cheque-container { 
              width: ${this.config.container.width};
              height: ${this.config.container.height};
              margin: 0 auto;
              position: relative;
              background: white;
              border: 1px solid #ccc;
            }
            .cheque-background {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-image: url('${this.config.background.imageUrl}');
              background-size: cover;
              background-position: center;
              opacity: ${this.config.background.opacity};
            }
            .field { 
              position: absolute;
              font-family: 'Courier New', monospace;
              font-weight: bold;
              color: #000;
              background: transparent;
              border: none;
              outline: none;
            }
            @page {
              size: ${this.config.container.width} ${this.config.container.height};
              margin: 0;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          
          .cheque-container {
            width: ${this.config.container.width};
            height: ${this.config.container.height};
            position: relative;
            background: white;
            border: 1px solid #ccc;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin: 0 auto;
          }
          
          .cheque-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('${this.config.background.imageUrl}');
            background-size: cover;
            background-position: center;
            opacity: ${this.config.background.opacity};
          }
          
          .field {
            position: absolute;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #000;
            background: transparent;
            border: none;
            outline: none;
          }
          
          .date-field {
            top: ${this.config.fields.date.top};
            left: ${this.config.fields.date.left};
            width: ${this.config.fields.date.width || 'auto'};
            font-size: ${this.config.fields.date.fontSize};
            text-align: ${this.config.fields.date.textAlign || 'left'};
          }
          
          .payee-field {
            top: ${this.config.fields.payee.top};
            left: ${this.config.fields.payee.left};
            max-width: ${this.config.fields.payee.maxWidth || 'none'};
            font-size: ${this.config.fields.payee.fontSize};
            text-align: ${this.config.fields.payee.textAlign || 'left'};
          }
          
          .amount-words-field {
            top: ${this.config.fields.amountWords.top};
            left: ${this.config.fields.amountWords.left};
            max-width: ${this.config.fields.amountWords.maxWidth || 'none'};
            height: ${this.config.fields.amountWords.height || 'auto'};
            font-size: ${this.config.fields.amountWords.fontSize};
            line-height: ${this.config.fields.amountWords.lineHeight || '1.2'};
            text-align: ${this.config.fields.amountWords.textAlign || 'left'};
          }
          
          .amount-field {
            top: ${this.config.fields.amount.top};
            left: ${this.config.fields.amount.left};
            width: ${this.config.fields.amount.width || 'auto'};
            font-size: ${this.config.fields.amount.fontSize};
            text-align: ${this.config.fields.amount.textAlign || 'left'};
          }
        </style>
      </head>
      <body>
        <div class="cheque-container">
          <div class="cheque-background"></div>
          
          <div class="field date-field">${this.testData.date}</div>
          <div class="field payee-field">${this.testData.payee}</div>
          <div class="field amount-field">${this.testData.amount}</div>
          <div class="field amount-words-field">${this.testData.amountWords}</div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
} 