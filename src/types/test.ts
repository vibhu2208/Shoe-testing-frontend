export interface Test {
  id: string;
  name: string;
  standard: string;
  category: 'Raw Material' | 'WIP' | 'Finished Good';
  description: string;
  key_tags: string[];
  formula_preview: string;
  input_parameters: any;
  calculation_steps: any[];
  pass_fail_logic: any;
  templateName?: string | null;
  templatePath?: string | null;
  templateKey?: string | null;
  template_name?: string | null;
  template_path?: string | null;
  template_key?: string | null;
}

export interface Stats {
  totalTests: number;
  categories: {
    'Raw Material': number;
    'WIP': number;
    'Finished Good': number;
  };
  standards: {
    [key: string]: number;
  };
}
