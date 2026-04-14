'use client'
import { useState } from 'react'

// ═══════════════════════════════════════════════════════════════
//  CATÁLOGO SIMEX — Embebido directamente (no requiere JSON externo)
// ═══════════════════════════════════════════════════════════════

const KIT: Record<string,{od?:number,a?:string,e?:string,eo?:number,g?:string,em?:string,t?:string,b?:number}> = {
  '10"|Acero': {"od": 273, "a": "CI-ABU-10AC", "e": "CN-EXT-10275", "eo": 275, "g": "JN-JGI-280", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|Asbesto A10': {"od": 293, "a": "CI-ABU-10272308", "e": "CN-EXT-10295", "eo": 295, "g": "JN-JGI-300", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|Asbesto A14': {"od": 308, "a": "CI-ABU-10272308", "e": "CN-EXT-10310", "eo": 310, "g": "JN-JGI-315", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|Asbesto A5': {"od": 283, "a": "CI-ABU-10AC", "e": "CN-EXT-10280", "eo": 280, "g": "JN-JGI-285", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|Asbesto A7': {"od": 288, "a": "CI-ABU-10AC", "e": "CN-EXT-10290", "eo": 290, "g": "JN-JGI-295", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|HD AWWA': {"od": 282, "a": "CI-ABU-10AC", "e": "CN-EXT-10280", "eo": 280, "g": "JN-JGI-285", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|HD ISO': {"od": 274, "a": "CI-ABU-10AC", "e": "CN-EXT-10275", "eo": 275, "g": "JN-JGI-280", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|PEAD': {"od": 273, "a": "CI-ABP-EAD10", "e": "CN-EXT-10275", "eo": 275, "g": "JN-JGI-280", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|PVC AWWA C900': {"od": 282, "a": "CI-ABU-10AC", "e": "CN-EXT-10280", "eo": 280, "g": "JN-JGI-285", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|PVC Inglés': {"od": 273, "a": "CI-ABU-10AC", "e": "CN-EXT-10275", "eo": 275, "g": "JN-JGI-280", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '10"|PVC Métrico': {"od": 250, "a": "CI-ABU-10245267", "e": "CN-EXT-10250", "eo": 250, "g": "JN-JGI-255", "em": "JI-ENE-10", "t": "DN-TOR-7/84", "b": 12},
  '12"|Acero': {"od": 324, "a": "CI-ABU-12", "e": "CN-EXT-12325", "eo": 325, "g": "JN-JGI-330", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|Asbesto A10': {"od": 352, "a": "CI-ABU-12324365", "e": "CN-EXT-12350", "eo": 350, "g": "JN-JGI-355", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|Asbesto A14': {"od": 370, "e": "CN-EXT-12370", "eo": 370, "g": "JN-JGI-375", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|Asbesto A5': {"od": 337, "a": "CI-ABU-12322342", "e": "CN-EXT-12335", "eo": 335, "g": "JN-JGI-340", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|Asbesto A7': {"od": 342, "a": "CI-ABU-12322342", "e": "CN-EXT-12340", "eo": 340, "g": "JN-JGI-345", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|HD AWWA': {"od": 335, "a": "CI-ABU-12322342", "e": "CN-EXT-12335", "eo": 335, "g": "JN-JGI-340", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|HD ISO': {"od": 326, "a": "CI-ABU-12", "e": "CN-EXT-12330", "eo": 330, "g": "JN-JGI-330", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|PEAD': {"od": 324, "a": "CI-ABP-EAD12", "e": "CN-EXT-12325", "eo": 325, "g": "JN-JGI-330", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|PVC AWWA C900': {"od": 335, "a": "CI-ABU-12322342", "e": "CN-EXT-12335", "eo": 335, "g": "JN-JGI-340", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|PVC Inglés': {"od": 324, "a": "CI-ABU-12", "e": "CN-EXT-12325", "eo": 325, "g": "JN-JGI-330", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '12"|PVC Métrico': {"od": 315, "a": "CI-ABU-12", "e": "CN-EXT-12315", "eo": 315, "g": "JN-JGI-320", "em": "JI-ENE-12", "t": "DN-TOR-7/84", "b": 12},
  '14"|Acero': {"od": 356, "a": "CI-ABU-14", "e": "CN-EXT-14355", "eo": 355, "g": "JN-JGI-360", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|Asbesto A10': {"od": 414, "e": "CN-EXT-14415", "eo": 415, "g": "JN-JGI-420", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|Asbesto A14': {"od": 432, "e": "CN-EXT-14430", "eo": 430, "g": "JN-JGI-435", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|Asbesto A5': {"od": 390, "a": "CI-ABU-14374391", "e": "CN-EXT-14390", "eo": 390, "g": "JN-JGI-395", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|Asbesto A7': {"od": 397, "e": "CN-EXT-14395", "eo": 395, "g": "JN-JGI-400", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|HD AWWA': {"od": 389, "a": "CI-ABU-14374391", "e": "CN-EXT-14385", "eo": 385, "g": "JN-JGI-390", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|HD ISO': {"od": 378, "a": "CI-ABU-14", "e": "CN-EXT-14378", "eo": 378, "g": "JN-JGI-385", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|PEAD': {"od": 356, "a": "CI-ABU-14", "e": "CN-EXT-14355", "eo": 355, "g": "JN-JGI-360", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|PVC AWWA C900': {"od": 389, "a": "CI-ABU-14374391", "e": "CN-EXT-14385", "eo": 385, "g": "JN-JGI-390", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|PVC Inglés': {"od": 357, "a": "CI-ABU-14", "e": "CN-EXT-14355", "eo": 355, "g": "JN-JGI-360", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '14"|PVC Métrico': {"od": 355, "a": "CI-ABU-14", "e": "CN-EXT-14355", "eo": 355, "g": "JN-JGI-360", "em": "JN-ENE-14", "t": "DN-TOR-141/2", "b": 12},
  '16"|Acero': {"od": 406, "a": "CI-ABU-16", "e": "CN-EXT-16400", "eo": 400, "g": "JN-JGI-405", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|Asbesto A10': {"od": 471, "e": "CN-EXT-16470", "eo": 470, "g": "JN-JGI-475", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|Asbesto A14': {"od": 492, "e": "CN-EXT-16490", "eo": 490, "g": "JN-JGI-495", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|Asbesto A5': {"od": 443, "e": "CN-EXT-16440", "eo": 440, "g": "JN-JGI-445", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|Asbesto A7': {"od": 452, "e": "CN-EXT-16450", "eo": 450, "g": "JN-JGI-455", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|HD AWWA': {"od": 442, "a": "CI-ABU-16425442", "e": "CN-EXT-16440", "eo": 440, "g": "JN-JGI-445", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|HD ISO': {"od": 429, "a": "CI-ABU-16390435", "g": "JN-JGI-435", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|PEAD': {"od": 406, "a": "CI-ABU-16", "e": "CN-EXT-16400", "eo": 400, "g": "JN-JGI-405", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|PVC AWWA C900': {"od": 442, "a": "CI-ABU-16425442", "e": "CN-EXT-16440", "eo": 440, "g": "JN-JGI-445", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '16"|PVC Métrico': {"od": 400, "a": "CI-ABU-16", "e": "CN-EXT-16400", "eo": 400, "g": "JN-JGI-405", "em": "JN-ENE-16", "t": "DN-TOR-141/2", "b": 16},
  '18"|Acero': {"od": 457, "a": "CI-ABU-18445472", "e": "CN-EXT-18460", "eo": 460, "g": "JN-JGI-465", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|Asbesto A10': {"od": 528, "e": "CN-EXT-18530", "eo": 530, "g": "JN-JGI-535", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|Asbesto A14': {"od": 552, "e": "CN-EXT-18550", "eo": 550, "g": "JN-JGI-555", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|Asbesto A5': {"od": 494, "a": "CI-ABU-18480510", "e": "CN-EXT-18495", "eo": 495, "g": "JN-JGI-500", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|Asbesto A7': {"od": 507, "a": "CI-ABU-18480510", "e": "CN-EXT-18505", "eo": 505, "g": "JN-JGI-510", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|HD AWWA': {"od": 495, "a": "CI-ABU-18480510", "e": "CN-EXT-18495", "eo": 495, "g": "JN-JGI-500", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|HD ISO': {"od": 480, "a": "CI-ABU-18480510", "e": "CN-EXT-18480", "eo": 480, "g": "JN-JGI-485", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|PEAD': {"od": 457, "a": "CI-ABU-18445472", "e": "CN-EXT-18460", "eo": 460, "g": "JN-JGI-465", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|PVC AWWA C900': {"od": 495, "a": "CI-ABU-18480510", "e": "CN-EXT-18495", "eo": 495, "g": "JN-JGI-500", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '18"|PVC Métrico': {"od": 450, "a": "CI-ABU-18445472", "e": "CN-EXT-18450", "eo": 450, "g": "JN-JGI-455", "em": "JN-ENE-18", "t": "DN-TOR-11/85", "b": 16},
  '2"|Acero': {"od": 60, "a": "CI-ABU-24860", "e": "CN-EXT-260", "eo": 60, "g": "JN-JGI-65", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '2"|Asbesto A10': {"od": 71, "a": "CI-ABU-2", "e": "CN-EXT-270", "eo": 70, "g": "JN-JGI-75", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '2"|Asbesto A14': {"od": 72, "a": "CI-ABU-2", "e": "CN-EXT-270", "eo": 70, "g": "JN-JGI-75", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '2"|Asbesto A5': {"od": 66, "a": "CI-ABU-2", "e": "CN-EXT-265", "eo": 65, "g": "JN-JGI-70", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '2"|Asbesto A7': {"od": 69, "a": "CI-ABU-2", "e": "CN-EXT-270", "eo": 70, "g": "JN-JGI-75", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '2"|PEAD': {"od": 60, "a": "CI-ABU-24860", "e": "CN-EXT-260", "eo": 60, "g": "JN-JGI-65", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '2"|PVC Inglés': {"od": 60, "a": "CI-ABU-24860", "e": "CN-EXT-260", "eo": 60, "g": "JN-JGI-65", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '2"|PVC Métrico': {"od": 50, "a": "CI-ABU-24860", "e": "CN-EXT-250", "eo": 50, "g": "JN-JGI-55", "em": "JI-ENE-2", "t": "DN-TOR-5/821/2", "b": 4},
  '20"|Acero': {"od": 508, "a": "CI-ABU-20500532", "e": "CN-EXT-20500", "eo": 500, "g": "JN-JGI-505", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|Asbesto A10': {"od": 581, "e": "CN-EXT-20580", "eo": 580, "g": "JN-JGI-585", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|Asbesto A14': {"od": 616, "e": "CN-EXT-20615", "eo": 615, "g": "JN-JGI-620", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|Asbesto A5': {"od": 546, "e": "CN-EXT-20545", "eo": 545, "g": "JN-JGI-550", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|Asbesto A7': {"od": 557, "e": "CN-EXT-20560", "eo": 560, "g": "JN-JGI-565", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|HD AWWA': {"od": 549, "e": "CN-EXT-20550", "eo": 550, "g": "JN-JGI-550", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|HD ISO': {"od": 532, "a": "CI-ABU-20527544", "g": "JN-JGI-535", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|PEAD': {"od": 508, "a": "CI-ABU-20500532", "e": "CN-EXT-20500", "eo": 500, "g": "JN-JGI-505", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|PVC AWWA C900': {"od": 549, "e": "CN-EXT-20550", "eo": 550, "g": "JN-JGI-550", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '20"|PVC Métrico': {"od": 500, "a": "CI-ABU-20500532", "e": "CN-EXT-20500", "eo": 500, "g": "JN-JGI-505", "em": "JN-ENE-20", "t": "DN-TOR-11/85", "b": 20},
  '24"|Acero': {"od": 610, "a": "CI-ABU-24", "e": "CN-EXT-24610", "eo": 610, "g": "JN-JGI-615", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|Asbesto A10': {"od": 669, "a": "CI-ABU-24645680", "e": "CN-EXT-24670", "eo": 670, "g": "JN-JGI-675", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|Asbesto A14': {"od": 698, "e": "CN-EXT-24700", "eo": 700, "g": "JN-JGI-705", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|Asbesto A5': {"od": 653, "a": "CI-ABU-24645680", "e": "CN-EXT-24655", "eo": 655, "g": "JN-JGI-660", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|Asbesto A7': {"od": 662, "a": "CI-ABU-24645680", "e": "CN-EXT-24660", "eo": 660, "g": "JN-JGI-665", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|HD AWWA': {"od": 655, "a": "CI-ABU-24645680", "e": "CN-EXT-24655", "eo": 655, "g": "JN-JGI-660", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|HD ISO': {"od": 635, "a": "CI-ABU-24", "e": "CN-EXT-24630", "eo": 630, "g": "JN-JGI-640", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|PEAD': {"od": 610, "a": "CI-ABU-24", "e": "CN-EXT-24610", "eo": 610, "g": "JN-JGI-615", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|PVC AWWA C900': {"od": 655, "a": "CI-ABU-24645680", "e": "CN-EXT-24655", "eo": 655, "g": "JN-JGI-660", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '24"|PVC Métrico': {"od": 630, "a": "CI-ABU-24", "e": "CN-EXT-24630", "eo": 630, "g": "JN-JGI-635", "em": "JN-ENE-24", "t": "DN-TOR-11/451/2", "b": 20},
  '2½"|Acero': {"od": 73, "a": "CI-ABU-257285", "e": "CN-EXT-2.573", "eo": 73, "g": "JN-JGI-75", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '2½"|Asbesto A10': {"od": 84, "a": "CI-ABU-257285", "e": "CN-EXT-2.585", "eo": 85, "g": "JN-JGI-90", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '2½"|Asbesto A14': {"od": 88, "e": "CN-EXT-2.590", "eo": 90, "g": "JN-JGI-95", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '2½"|Asbesto A5': {"od": 80, "a": "CI-ABU-257285", "e": "CN-EXT-2.580", "eo": 80, "g": "JN-JGI-85", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '2½"|Asbesto A7': {"od": 82, "a": "CI-ABU-257285", "e": "CN-EXT-2.580", "eo": 80, "g": "JN-JGI-85", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '2½"|PEAD': {"od": 73, "a": "CI-ABU-257285", "e": "CN-EXT-2.573", "eo": 73, "g": "JN-JGI-75", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '2½"|PVC Inglés': {"od": 73, "a": "CI-ABU-257285", "e": "CN-EXT-2.573", "eo": 73, "g": "JN-JGI-75", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '2½"|PVC Métrico': {"od": 63, "e": "CN-EXT-2.563", "eo": 63, "g": "JN-JGI-65", "em": "JI-ENE-2.5", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|Acero': {"od": 89, "a": "CI-ABU-3", "e": "CN-EXT-388", "eo": 88, "g": "JN-JGI-95", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|Asbesto A10': {"od": 103, "a": "CI-ABU-3", "e": "CN-EXT-3105", "eo": 105, "g": "JN-JGI-110", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|Asbesto A14': {"od": 109, "a": "CI-ABU-496116", "e": "CN-EXT-3110", "eo": 110, "g": "JN-JGI-115", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|Asbesto A5': {"od": 97, "a": "CI-ABU-3", "e": "CN-EXT-395", "eo": 95, "g": "JN-JGI-100", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|Asbesto A7': {"od": 100, "a": "CI-ABU-3", "e": "CN-EXT-3100", "eo": 100, "g": "JN-JGI-105", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|HD ISO': {"od": 98, "a": "CI-ABU-3", "e": "CN-EXT-3100", "eo": 100, "g": "JN-JGI-105", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|PEAD': {"od": 89, "a": "CI-ABP-EAD3", "e": "CN-EXT-388", "eo": 88, "g": "JN-JGI-90", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|PVC Inglés': {"od": 89, "a": "CI-ABU-3", "e": "CN-EXT-388", "eo": 88, "g": "JN-JGI-90", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '3"|PVC Métrico': {"od": 80, "e": "CN-EXT-380", "eo": 80, "g": "JN-JGI-85", "em": "JI-ENE-3", "t": "DN-TOR-5/821/2", "b": 4},
  '30"|Acero': {"od": 762, "e": "CN-EXT-30762", "eo": 762, "g": "JN-JGI-765", "em": "JN-ENE-30", "t": "DN-TOR-11/46", "b": 28},
  '30"|HD AWWA': {"od": 762, "e": "CN-EXT-30762", "eo": 762, "g": "JN-JGI-765", "em": "JN-ENE-30", "t": "DN-TOR-11/46", "b": 28},
  '30"|HD ISO': {"od": 762, "e": "CN-EXT-30762", "eo": 762, "g": "JN-JGI-765", "em": "JN-ENE-30", "t": "DN-TOR-11/46", "b": 28},
  '36"|Acero': {"od": 914, "e": "CN-EXT-36915", "eo": 915, "g": "JN-JGI-920", "em": "JN-ENE-36", "t": "DN-TOR-11/27", "b": 32},
  '36"|HD AWWA': {"od": 914, "e": "CN-EXT-36915", "eo": 915, "g": "JN-JGI-920", "em": "JN-ENE-36", "t": "DN-TOR-11/27", "b": 32},
  '36"|HD ISO': {"od": 914, "e": "CN-EXT-36915", "eo": 915, "g": "JN-JGI-920", "em": "JN-ENE-36", "t": "DN-TOR-11/27", "b": 32},
  '4"|Acero': {"od": 114, "a": "CI-ABU-4109130", "e": "CN-EXT-4114", "eo": 114, "g": "JN-JGI-115", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|Asbesto A10': {"od": 127, "a": "CI-ABU-4109130", "e": "CN-EXT-4125", "eo": 125, "g": "JN-JGI-130", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|Asbesto A14': {"od": 133, "a": "CI-ABU-4107135", "e": "CN-EXT-4135", "eo": 135, "g": "JN-JGI-140", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|Asbesto A5': {"od": 121, "a": "CI-ABU-4109130", "e": "CN-EXT-4120", "eo": 120, "g": "JN-JGI-125", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|Asbesto A7': {"od": 123, "a": "CI-ABU-4109130", "e": "CN-EXT-4125", "eo": 125, "g": "JN-JGI-130", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|HD AWWA': {"od": 122, "a": "CI-ABU-4109130", "e": "CN-EXT-4120", "eo": 120, "g": "JN-JGI-125", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|HD ISO': {"od": 118, "a": "CI-ABU-4109130", "e": "CN-EXT-4120", "eo": 120, "g": "JN-JGI-125", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|PEAD': {"od": 114, "a": "CI-ABP-EAD4", "e": "CN-EXT-4114", "eo": 114, "g": "JN-JGI-115", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|PVC AWWA C900': {"od": 122, "a": "CI-ABU-4109130", "e": "CN-EXT-4120", "eo": 120, "g": "JN-JGI-125", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|PVC Inglés': {"od": 114, "a": "CI-ABU-4109130", "e": "CN-EXT-4114", "eo": 114, "g": "JN-JGI-115", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '4"|PVC Métrico': {"od": 100, "a": "CI-ABU-496116", "e": "CN-EXT-4100", "eo": 100, "g": "JN-JGI-105", "em": "JI-ENE-4", "t": "DN-TOR-5/83", "b": 8},
  '6"|Acero': {"od": 168, "a": "CI-ABU-6159184", "e": "CN-EXT-6168", "eo": 168, "g": "JN-JGI-170", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|Asbesto A10': {"od": 181, "a": "CI-ABU-6159184", "e": "CN-EXT-6180", "eo": 180, "g": "JN-JGI-185", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|Asbesto A14': {"od": 190, "e": "CN-EXT-6190", "eo": 190, "g": "JN-JGI-195", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|Asbesto A5': {"od": 172, "a": "CI-ABU-6159184", "e": "CN-EXT-6170", "eo": 170, "g": "JN-JGI-175", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|Asbesto A7': {"od": 175, "a": "CI-ABU-6159184", "e": "CN-EXT-6175", "eo": 175, "g": "JN-JGI-180", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|HD AWWA': {"od": 175, "a": "CI-ABU-6159184", "e": "CN-EXT-6175", "eo": 175, "g": "JN-JGI-180", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|HD ISO': {"od": 170, "a": "CI-ABU-6159184", "e": "CN-EXT-6170", "eo": 170, "g": "JN-JGI-175", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|PEAD': {"od": 168, "a": "CI-ABP-EAD6", "e": "CN-EXT-6168", "eo": 168, "g": "JN-JGI-170", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|PVC AWWA C900': {"od": 175, "a": "CI-ABU-6159184", "e": "CN-EXT-6175", "eo": 175, "g": "JN-JGI-180", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|PVC Inglés': {"od": 168, "a": "CI-ABU-6159184", "e": "CN-EXT-6168", "eo": 168, "g": "JN-JGI-170", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '6"|PVC Métrico': {"od": 160, "a": "CI-ABU-6159184", "e": "CN-EXT-6160", "eo": 160, "g": "JN-JGI-165", "em": "JI-ENE-6", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|Acero': {"od": 219, "a": "CI-ABU-8I", "e": "CN-EXT-8219", "eo": 219, "g": "JN-JGI-225", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|Asbesto A10': {"od": 236, "a": "CI-ABU-8214249", "e": "CN-EXT-8235", "eo": 235, "g": "JN-JGI-240", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|Asbesto A14': {"od": 248, "a": "CI-ABU-8214249", "e": "CN-EXT-8250", "eo": 250, "g": "JN-JGI-255", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|Asbesto A5': {"od": 224, "a": "CI-ABU-8I", "e": "CN-EXT-8225", "eo": 225, "g": "JN-JGI-230", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|Asbesto A7': {"od": 229, "a": "CI-ABU-8I", "e": "CN-EXT-8230", "eo": 230, "g": "JN-JGI-235", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|HD AWWA': {"od": 230, "a": "CI-ABU-8I", "e": "CN-EXT-8230", "eo": 230, "g": "JN-JGI-235", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|HD ISO': {"od": 222, "a": "CI-ABU-8I", "e": "CN-EXT-8225", "eo": 225, "g": "JN-JGI-230", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|PEAD': {"od": 219, "a": "CI-ABP-EAD8", "e": "CN-EXT-8219", "eo": 219, "g": "JN-JGI-220", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|PVC AWWA C900': {"od": 230, "a": "CI-ABU-8I", "e": "CN-EXT-8230", "eo": 230, "g": "JN-JGI-235", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|PVC Inglés': {"od": 219, "a": "CI-ABU-8I", "e": "CN-EXT-8219", "eo": 219, "g": "JN-JGI-220", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8},
  '8"|PVC Métrico': {"od": 200, "a": "CI-ABU-8M", "e": "CN-EXT-8200", "eo": 200, "g": "JN-JGI-205", "em": "JI-ENE-8", "t": "DN-TOR-3/431/2", "b": 8}
}

const CONN: Array<{f:string,d1:string,d2:string,sk:string,br:number}> = [
{"f": "Codo HD", "d1": "2\"", "d2": "11°", "sk": "CI-CFB-211", "br": 2},
{"f": "Codo HD", "d1": "2\"", "d2": "22°", "sk": "CI-CFB-222", "br": 2},
{"f": "Codo HD", "d1": "2\"", "d2": "45°", "sk": "CI-CFB-245", "br": 2},
{"f": "Codo HD", "d1": "2\"", "d2": "90°", "sk": "CI-CFB-290", "br": 2},
{"f": "Codo HD", "d1": "2½\"", "d2": "45°", "sk": "CI-CFB-2.545", "br": 2},
{"f": "Codo HD", "d1": "2½\"", "d2": "90°", "sk": "CI-CFB-2.590", "br": 2},
{"f": "Codo HD", "d1": "3\"", "d2": "11°", "sk": "CI-CFB-311", "br": 2},
{"f": "Codo HD", "d1": "3\"", "d2": "22°", "sk": "CI-CFB-322", "br": 2},
{"f": "Codo HD", "d1": "3\"", "d2": "45°", "sk": "CI-CFB-345", "br": 2},
{"f": "Codo HD", "d1": "3\"", "d2": "90°", "sk": "CI-CFB-390", "br": 2},
{"f": "Codo HD", "d1": "4\"", "d2": "11°", "sk": "CI-CFB-411", "br": 2},
{"f": "Codo HD", "d1": "4\"", "d2": "22°", "sk": "CI-CFB-422", "br": 2},
{"f": "Codo HD", "d1": "4\"", "d2": "45°", "sk": "CI-CFB-445", "br": 2},
{"f": "Codo HD", "d1": "4\"", "d2": "90°", "sk": "CI-CFB-490", "br": 2},
{"f": "Codo HD", "d1": "6\"", "d2": "11°", "sk": "CI-CFB-611", "br": 2},
{"f": "Codo HD", "d1": "6\"", "d2": "22°", "sk": "CI-CFB-622", "br": 2},
{"f": "Codo HD", "d1": "6\"", "d2": "45°", "sk": "CI-CFB-645", "br": 2},
{"f": "Codo HD", "d1": "6\"", "d2": "90°", "sk": "CI-CFB-690", "br": 2},
{"f": "Codo HD", "d1": "8\"", "d2": "11°", "sk": "CI-CFB-811", "br": 2},
{"f": "Codo HD", "d1": "8\"", "d2": "22°", "sk": "CI-CFB-822", "br": 2},
{"f": "Codo HD", "d1": "8\"", "d2": "45°", "sk": "CI-CFB-845", "br": 2},
{"f": "Codo HD", "d1": "8\"", "d2": "90°", "sk": "CI-CFB-890", "br": 2},
{"f": "Codo HD", "d1": "10\"", "d2": "11°", "sk": "CI-CFB-1011", "br": 2},
{"f": "Codo HD", "d1": "10\"", "d2": "22°", "sk": "CI-CFB-1022", "br": 2},
{"f": "Codo HD", "d1": "10\"", "d2": "45°", "sk": "CI-CFB-1045", "br": 2},
{"f": "Codo HD", "d1": "10\"", "d2": "90°", "sk": "CI-CFB-1090", "br": 2},
{"f": "Codo HD", "d1": "12\"", "d2": "11°", "sk": "CI-CFB-1211", "br": 2},
{"f": "Codo HD", "d1": "12\"", "d2": "22°", "sk": "CI-CFB-1222", "br": 2},
{"f": "Codo HD", "d1": "12\"", "d2": "45°", "sk": "CI-CFB-1245", "br": 2},
{"f": "Codo HD", "d1": "12\"", "d2": "90°", "sk": "CI-CFB-1290", "br": 2},
{"f": "Codo HD", "d1": "14\"", "d2": "11°", "sk": "CI-CFB-1411", "br": 2},
{"f": "Codo HD", "d1": "14\"", "d2": "22°", "sk": "CI-CFB-1422", "br": 2},
{"f": "Codo HD", "d1": "14\"", "d2": "45°", "sk": "CI-CFB-1445", "br": 2},
{"f": "Codo HD", "d1": "14\"", "d2": "90°", "sk": "CI-CFB-1490", "br": 2},
{"f": "Codo HD", "d1": "16\"", "d2": "11°", "sk": "CI-CFB-1611", "br": 2},
{"f": "Codo HD", "d1": "16\"", "d2": "22°", "sk": "CI-CFB-1622", "br": 2},
{"f": "Codo HD", "d1": "16\"", "d2": "45°", "sk": "CI-CFB-1645", "br": 2},
{"f": "Codo HD", "d1": "16\"", "d2": "90°", "sk": "CI-CFB-1690", "br": 2},
{"f": "Codo HD", "d1": "18\"", "d2": "11°", "sk": "CI-CFB-1811", "br": 2},
{"f": "Codo HD", "d1": "18\"", "d2": "22°", "sk": "CI-CFB-1822", "br": 2},
{"f": "Codo HD", "d1": "18\"", "d2": "45°", "sk": "CI-CFB-1845", "br": 2},
{"f": "Codo HD", "d1": "18\"", "d2": "90°", "sk": "CI-CFB-1890", "br": 2},
{"f": "Codo HD", "d1": "20\"", "d2": "11°", "sk": "CI-CFB-2011", "br": 2},
{"f": "Codo HD", "d1": "20\"", "d2": "22°", "sk": "CI-CFB-2022", "br": 2},
{"f": "Codo HD", "d1": "20\"", "d2": "45°", "sk": "CI-CFB-2045", "br": 2},
{"f": "Codo HD", "d1": "20\"", "d2": "90°", "sk": "CI-CFB-2090", "br": 2},
{"f": "Codo HD", "d1": "24\"", "d2": "11°", "sk": "CI-CFB-2411", "br": 2},
{"f": "Codo HD", "d1": "24\"", "d2": "22°", "sk": "CI-CFB-2422", "br": 2},
{"f": "Codo HD", "d1": "24\"", "d2": "45°", "sk": "CI-CFB-2445", "br": 2},
{"f": "Codo HD", "d1": "24\"", "d2": "90°", "sk": "CI-CFB-2490", "br": 2},
{"f": "Codo HD", "d1": "30\"", "d2": "22°", "sk": "CI-CFB-3022", "br": 2},
{"f": "Codo HD", "d1": "30\"", "d2": "45°", "sk": "CI-CFB-3045", "br": 2},
{"f": "Codo HD", "d1": "30\"", "d2": "90°", "sk": "CI-CFB-3090", "br": 2},
{"f": "Codo HD", "d1": "36\"", "d2": "45°", "sk": "CI-CFB-3645", "br": 2},
{"f": "Codo HD", "d1": "36\"", "d2": "90°", "sk": "CI-CFB-3690", "br": 2},
{"f": "Cruz HD", "d1": "2\"", "d2": "2\"", "sk": "CI-CFC-22", "br": 4},
{"f": "Cruz HD", "d1": "2½\"", "d2": "2\"", "sk": "CI-CFC-252", "br": 4},
{"f": "Cruz HD", "d1": "2½\"", "d2": "2½\"", "sk": "CI-CFC-2525", "br": 4},
{"f": "Cruz HD", "d1": "3\"", "d2": "2\"", "sk": "CI-CFC-32", "br": 4},
{"f": "Cruz HD", "d1": "3\"", "d2": "3\"", "sk": "CI-CFC-33", "br": 4},
{"f": "Cruz HD", "d1": "4\"", "d2": "2\"", "sk": "CI-CFC-42", "br": 4},
{"f": "Cruz HD", "d1": "4\"", "d2": "3\"", "sk": "CI-CFC-43", "br": 4},
{"f": "Cruz HD", "d1": "4\"", "d2": "4\"", "sk": "CI-CFC-44", "br": 4},
{"f": "Cruz HD", "d1": "6\"", "d2": "2\"", "sk": "CI-CFC-62", "br": 4},
{"f": "Cruz HD", "d1": "6\"", "d2": "3\"", "sk": "CI-CFC-63", "br": 4},
{"f": "Cruz HD", "d1": "6\"", "d2": "4\"", "sk": "CI-CFC-64", "br": 4},
{"f": "Cruz HD", "d1": "6\"", "d2": "6\"", "sk": "CI-CFC-66", "br": 4},
{"f": "Cruz HD", "d1": "8\"", "d2": "3\"", "sk": "CI-CFC-83", "br": 4},
{"f": "Cruz HD", "d1": "8\"", "d2": "4\"", "sk": "CI-CFC-84", "br": 4},
{"f": "Cruz HD", "d1": "8\"", "d2": "6\"", "sk": "CI-CFC-86", "br": 4},
{"f": "Cruz HD", "d1": "8\"", "d2": "8\"", "sk": "CI-CFC-88", "br": 4},
{"f": "Cruz HD", "d1": "10\"", "d2": "2\"", "sk": "CI-CFC-102", "br": 4},
{"f": "Cruz HD", "d1": "10\"", "d2": "3\"", "sk": "CI-CFC-103", "br": 4},
{"f": "Cruz HD", "d1": "10\"", "d2": "4\"", "sk": "CI-CFC-104", "br": 4},
{"f": "Cruz HD", "d1": "10\"", "d2": "6\"", "sk": "CI-CFC-106", "br": 4},
{"f": "Cruz HD", "d1": "10\"", "d2": "8\"", "sk": "CI-CFC-108", "br": 4},
{"f": "Cruz HD", "d1": "10\"", "d2": "10\"", "sk": "CI-CFC-1010", "br": 4},
{"f": "Cruz HD", "d1": "12\"", "d2": "4\"", "sk": "CI-CFC-124", "br": 4},
{"f": "Cruz HD", "d1": "12\"", "d2": "6\"", "sk": "CI-CFC-126", "br": 4},
{"f": "Cruz HD", "d1": "12\"", "d2": "8\"", "sk": "CI-CFC-128", "br": 4},
{"f": "Cruz HD", "d1": "12\"", "d2": "10\"", "sk": "CI-CFC-1210", "br": 4},
{"f": "Cruz HD", "d1": "12\"", "d2": "12\"", "sk": "CI-CFC-1212", "br": 4},
{"f": "Cruz HD", "d1": "14\"", "d2": "6\"", "sk": "CI-CFC-146", "br": 4},
{"f": "Cruz HD", "d1": "14\"", "d2": "8\"", "sk": "CI-CFC-148", "br": 4},
{"f": "Cruz HD", "d1": "14\"", "d2": "10\"", "sk": "CI-CFC-1410", "br": 4},
{"f": "Cruz HD", "d1": "16\"", "d2": "8\"", "sk": "CI-CFC-168", "br": 4},
{"f": "Cruz HD", "d1": "18\"", "d2": "8\"", "sk": "CI-CFC-188", "br": 4},
{"f": "Cruz HD", "d1": "20\"", "d2": "8\"", "sk": "CI-CFC-208", "br": 4},
{"f": "Cruz HD", "d1": "20\"", "d2": "14\"", "sk": "CI-CFC-2014", "br": 4},
{"f": "Cruz HD", "d1": "20\"", "d2": "20\"", "sk": "CI-CFC-2020", "br": 4},
{"f": "Cruz HD", "d1": "24\"", "d2": "10\"", "sk": "CI-CFC-2410", "br": 4},
{"f": "Cruz HD", "d1": "24\"", "d2": "24\"", "sk": "CI-CFC-2424", "br": 4},
{"f": "Reducció", "d1": "2½\"", "d2": "2\"", "sk": "CI-CFR-252", "br": 2},
{"f": "Reducció", "d1": "3\"", "d2": "2\"", "sk": "CI-CFR-32", "br": 2},
{"f": "Reducció", "d1": "3\"", "d2": "2½\"", "sk": "CI-CFR-325", "br": 2},
{"f": "Reducció", "d1": "4\"", "d2": "2\"", "sk": "CI-CFR-42", "br": 2},
{"f": "Reducció", "d1": "4\"", "d2": "2½\"", "sk": "CI-CFR-425", "br": 2},
{"f": "Reducció", "d1": "4\"", "d2": "3\"", "sk": "CI-CFR-43", "br": 2},
{"f": "Reducció", "d1": "6\"", "d2": "2\"", "sk": "CI-CFR-62", "br": 2},
{"f": "Reducció", "d1": "6\"", "d2": "2½\"", "sk": "CI-CFR-62.5", "br": 2},
{"f": "Reducció", "d1": "6\"", "d2": "3\"", "sk": "CI-CFR-63", "br": 2},
{"f": "Reducció", "d1": "6\"", "d2": "4\"", "sk": "CI-CFR-64", "br": 2},
{"f": "Reducció", "d1": "8\"", "d2": "2\"", "sk": "CI-CFR-82", "br": 2},
{"f": "Reducció", "d1": "8\"", "d2": "3\"", "sk": "CI-CFR-83", "br": 2},
{"f": "Reducció", "d1": "8\"", "d2": "4\"", "sk": "CI-CFR-84", "br": 2},
{"f": "Reducció", "d1": "8\"", "d2": "6\"", "sk": "CI-CFR-86", "br": 2},
{"f": "Reducció", "d1": "10\"", "d2": "3\"", "sk": "CI-CFR-103", "br": 2},
{"f": "Reducció", "d1": "10\"", "d2": "4\"", "sk": "CI-CFR-104", "br": 2},
{"f": "Reducció", "d1": "10\"", "d2": "6\"", "sk": "CI-CFR-106", "br": 2},
{"f": "Reducció", "d1": "10\"", "d2": "8\"", "sk": "CI-CFR-108", "br": 2},
{"f": "Reducció", "d1": "12\"", "d2": "3\"", "sk": "CI-CFR-123", "br": 2},
{"f": "Reducció", "d1": "12\"", "d2": "4\"", "sk": "CI-CFR-124", "br": 2},
{"f": "Reducció", "d1": "12\"", "d2": "6\"", "sk": "CI-CFR-126", "br": 2},
{"f": "Reducció", "d1": "12\"", "d2": "8\"", "sk": "CI-CFR-128", "br": 2},
{"f": "Reducció", "d1": "12\"", "d2": "10\"", "sk": "CI-CFR-1210", "br": 2},
{"f": "Reducció", "d1": "14\"", "d2": "6\"", "sk": "CI-CFR-146", "br": 2},
{"f": "Reducció", "d1": "14\"", "d2": "8\"", "sk": "CI-CFR-148", "br": 2},
{"f": "Reducció", "d1": "14\"", "d2": "10\"", "sk": "CI-CFR-1410", "br": 2},
{"f": "Reducció", "d1": "14\"", "d2": "12\"", "sk": "CI-CFR-1412", "br": 2},
{"f": "Reducció", "d1": "16\"", "d2": "6\"", "sk": "CI-CFR-166", "br": 2},
{"f": "Reducció", "d1": "16\"", "d2": "8\"", "sk": "CI-CFR-168", "br": 2},
{"f": "Reducció", "d1": "16\"", "d2": "10\"", "sk": "CI-CFR-1610", "br": 2},
{"f": "Reducció", "d1": "16\"", "d2": "12\"", "sk": "CI-CFR-1612", "br": 2},
{"f": "Reducció", "d1": "16\"", "d2": "14\"", "sk": "CI-CFR-1614", "br": 2},
{"f": "Reducció", "d1": "18\"", "d2": "6\"", "sk": "CI-CFR-186", "br": 2},
{"f": "Reducció", "d1": "18\"", "d2": "8\"", "sk": "CI-CFR-188", "br": 2},
{"f": "Reducció", "d1": "18\"", "d2": "10\"", "sk": "CI-CFR-1810", "br": 2},
{"f": "Reducció", "d1": "18\"", "d2": "12\"", "sk": "CI-CFR-1812", "br": 2},
{"f": "Reducció", "d1": "18\"", "d2": "14\"", "sk": "CI-CFR-1814", "br": 2},
{"f": "Reducció", "d1": "18\"", "d2": "16\"", "sk": "CI-CFR-1816", "br": 2},
{"f": "Reducció", "d1": "20\"", "d2": "6\"", "sk": "CI-CFR-206", "br": 2},
{"f": "Reducció", "d1": "20\"", "d2": "8\"", "sk": "CI-CFR-208", "br": 2},
{"f": "Reducció", "d1": "20\"", "d2": "10\"", "sk": "CI-CFR-2010", "br": 2},
{"f": "Reducció", "d1": "20\"", "d2": "12\"", "sk": "CI-CFR-2012", "br": 2},
{"f": "Reducció", "d1": "20\"", "d2": "14\"", "sk": "CI-CFR-2014", "br": 2},
{"f": "Reducció", "d1": "20\"", "d2": "16\"", "sk": "CI-CFR-2016", "br": 2},
{"f": "Reducció", "d1": "20\"", "d2": "18\"", "sk": "CI-CFR-2018", "br": 2},
{"f": "Reducció", "d1": "24\"", "d2": "8\"", "sk": "CI-CFR-248", "br": 2},
{"f": "Reducció", "d1": "24\"", "d2": "10\"", "sk": "CI-CFR-2410", "br": 2},
{"f": "Reducció", "d1": "24\"", "d2": "12\"", "sk": "CI-CFR-2412", "br": 2},
{"f": "Reducció", "d1": "24\"", "d2": "14\"", "sk": "CI-CFR-2414", "br": 2},
{"f": "Reducció", "d1": "24\"", "d2": "16\"", "sk": "CI-CFR-2416", "br": 2},
{"f": "Reducció", "d1": "24\"", "d2": "18\"", "sk": "CI-CFR-2418", "br": 2},
{"f": "Reducció", "d1": "24\"", "d2": "20\"", "sk": "CI-CFR-2420", "br": 2},
{"f": "Reducció", "d1": "30\"", "d2": "20\"", "sk": "CI-CFR-3020", "br": 2},
{"f": "Reducció", "d1": "30\"", "d2": "24\"", "sk": "CI-CFR-3024", "br": 2},
{"f": "Reducció", "d1": "36\"", "d2": "24\"", "sk": "CI-CFR-3624", "br": 2},
{"f": "Reducció", "d1": "36\"", "d2": "30\"", "sk": "CI-CFR-3630", "br": 2},
{"f": "Tee HD B", "d1": "2\"", "d2": "2\"", "sk": "CI-CFT-22", "br": 3},
{"f": "Tee HD B", "d1": "2½\"", "d2": "2\"", "sk": "CI-CFT-252", "br": 3},
{"f": "Tee HD B", "d1": "2½\"", "d2": "2½\"", "sk": "CI-CFT-2525", "br": 3},
{"f": "Tee HD B", "d1": "3\"", "d2": "2\"", "sk": "CI-CFT-32", "br": 3},
{"f": "Tee HD B", "d1": "3\"", "d2": "2½\"", "sk": "CI-CFT-325", "br": 3},
{"f": "Tee HD B", "d1": "3\"", "d2": "3\"", "sk": "CI-CFT-33", "br": 3},
{"f": "Tee HD B", "d1": "4\"", "d2": "2\"", "sk": "CI-CFT-42", "br": 3},
{"f": "Tee HD B", "d1": "4\"", "d2": "2½\"", "sk": "CI-CFT-42.5", "br": 3},
{"f": "Tee HD B", "d1": "4\"", "d2": "3\"", "sk": "CI-CFT-43", "br": 3},
{"f": "Tee HD B", "d1": "4\"", "d2": "4\"", "sk": "CI-CFT-44", "br": 3},
{"f": "Tee HD B", "d1": "6\"", "d2": "2\"", "sk": "CI-CFT-62", "br": 3},
{"f": "Tee HD B", "d1": "6\"", "d2": "2½\"", "sk": "CI-CFT-625", "br": 3},
{"f": "Tee HD B", "d1": "6\"", "d2": "3\"", "sk": "CI-CFT-63", "br": 3},
{"f": "Tee HD B", "d1": "6\"", "d2": "4\"", "sk": "CI-CFT-64", "br": 3},
{"f": "Tee HD B", "d1": "6\"", "d2": "6\"", "sk": "CI-CFT-66", "br": 3},
{"f": "Tee HD B", "d1": "8\"", "d2": "2\"", "sk": "CI-CFT-82", "br": 3},
{"f": "Tee HD B", "d1": "8\"", "d2": "2½\"", "sk": "CI-CFT-825", "br": 3},
{"f": "Tee HD B", "d1": "8\"", "d2": "3\"", "sk": "CI-CFT-83", "br": 3},
{"f": "Tee HD B", "d1": "8\"", "d2": "4\"", "sk": "CI-CFT-84", "br": 3},
{"f": "Tee HD B", "d1": "8\"", "d2": "6\"", "sk": "CI-CFT-86", "br": 3},
{"f": "Tee HD B", "d1": "8\"", "d2": "8\"", "sk": "CI-CFT-88", "br": 3},
{"f": "Tee HD B", "d1": "10\"", "d2": "2\"", "sk": "CI-CFT-102", "br": 3},
{"f": "Tee HD B", "d1": "10\"", "d2": "2½\"", "sk": "CI-CFT-1025", "br": 3},
{"f": "Tee HD B", "d1": "10\"", "d2": "3\"", "sk": "CI-CFT-103", "br": 3},
{"f": "Tee HD B", "d1": "10\"", "d2": "4\"", "sk": "CI-CFT-104", "br": 3},
{"f": "Tee HD B", "d1": "10\"", "d2": "6\"", "sk": "CI-CFT-106", "br": 3},
{"f": "Tee HD B", "d1": "10\"", "d2": "8\"", "sk": "CI-CFT-108", "br": 3},
{"f": "Tee HD B", "d1": "10\"", "d2": "10\"", "sk": "CI-CFT-1010", "br": 3},
{"f": "Tee HD B", "d1": "12\"", "d2": "3\"", "sk": "CI-CFT-123", "br": 3},
{"f": "Tee HD B", "d1": "12\"", "d2": "4\"", "sk": "CI-CFT-124", "br": 3},
{"f": "Tee HD B", "d1": "12\"", "d2": "6\"", "sk": "CI-CFT-126", "br": 3},
{"f": "Tee HD B", "d1": "12\"", "d2": "8\"", "sk": "CI-CFT-128", "br": 3},
{"f": "Tee HD B", "d1": "12\"", "d2": "10\"", "sk": "CI-CFT-1210", "br": 3},
{"f": "Tee HD B", "d1": "12\"", "d2": "12\"", "sk": "CI-CFT-1212", "br": 3},
{"f": "Tee HD B", "d1": "14\"", "d2": "4\"", "sk": "CI-CFT-144", "br": 3},
{"f": "Tee HD B", "d1": "14\"", "d2": "6\"", "sk": "CI-CFT-146", "br": 3},
{"f": "Tee HD B", "d1": "14\"", "d2": "8\"", "sk": "CI-CFT-148", "br": 3},
{"f": "Tee HD B", "d1": "14\"", "d2": "10\"", "sk": "CI-CFT-1410", "br": 3},
{"f": "Tee HD B", "d1": "14\"", "d2": "12\"", "sk": "CI-CFT-1412", "br": 3},
{"f": "Tee HD B", "d1": "14\"", "d2": "14\"", "sk": "CI-CFT-1414", "br": 3},
{"f": "Tee HD B", "d1": "16\"", "d2": "4\"", "sk": "CI-CFT-164", "br": 3},
{"f": "Tee HD B", "d1": "16\"", "d2": "6\"", "sk": "CI-CFT-166", "br": 3},
{"f": "Tee HD B", "d1": "16\"", "d2": "8\"", "sk": "CI-CFT-168", "br": 3},
{"f": "Tee HD B", "d1": "16\"", "d2": "10\"", "sk": "CI-CFT-1610", "br": 3},
{"f": "Tee HD B", "d1": "16\"", "d2": "12\"", "sk": "CI-CFT-1612", "br": 3},
{"f": "Tee HD B", "d1": "16\"", "d2": "14\"", "sk": "CI-CFT-1614", "br": 3},
{"f": "Tee HD B", "d1": "16\"", "d2": "16\"", "sk": "CI-CFT-1616", "br": 3},
{"f": "Tee HD B", "d1": "18\"", "d2": "4\"", "sk": "CI-CFT-184", "br": 3},
{"f": "Tee HD B", "d1": "18\"", "d2": "6\"", "sk": "CI-CFT-186", "br": 3},
{"f": "Tee HD B", "d1": "18\"", "d2": "8\"", "sk": "CI-CFT-188", "br": 3},
{"f": "Tee HD B", "d1": "18\"", "d2": "10\"", "sk": "CI-CFT-1810", "br": 3},
{"f": "Tee HD B", "d1": "18\"", "d2": "12\"", "sk": "CI-CFT-1812", "br": 3},
{"f": "Tee HD B", "d1": "18\"", "d2": "16\"", "sk": "CI-CFT-1816", "br": 3},
{"f": "Tee HD B", "d1": "18\"", "d2": "18\"", "sk": "CI-CFT-1818", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "4\"", "sk": "CI-CFT-204", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "6\"", "sk": "CI-CFT-206", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "8\"", "sk": "CI-CFT-208", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "10\"", "sk": "CI-CFT-2010", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "12\"", "sk": "CI-CFT-2012", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "14\"", "sk": "CI-CFT-2014", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "16\"", "sk": "CI-CFT-2016", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "18\"", "sk": "CI-CFT-2018", "br": 3},
{"f": "Tee HD B", "d1": "20\"", "d2": "20\"", "sk": "CI-CFT-2020", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "6\"", "sk": "CI-CFT-246", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "8\"", "sk": "CI-CFT-248", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "10\"", "sk": "CI-CFT-2410", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "12\"", "sk": "CI-CFT-2412", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "14\"", "sk": "CI-CFT-2414", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "16\"", "sk": "CI-CFT-2416", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "20\"", "sk": "CI-CFT-2420", "br": 3},
{"f": "Tee HD B", "d1": "24\"", "d2": "24\"", "sk": "CI-CFT-2424", "br": 3},
{"f": "Tee HD B", "d1": "30\"", "d2": "10\"", "sk": "CI-CFT-3010", "br": 3},
{"f": "Tee HD B", "d1": "30\"", "d2": "12\"", "sk": "CI-CFT-3012", "br": 3},
{"f": "Tee HD B", "d1": "30\"", "d2": "24\"", "sk": "CI-CFT-3024", "br": 3},
{"f": "Tee HD B", "d1": "30\"", "d2": "30\"", "sk": "CI-CFT-3030", "br": 3},
{"f": "Tee HD B", "d1": "36\"", "d2": "20\"", "sk": "CI-CFT-3620", "br": 3},
{"f": "Tee HD B", "d1": "36\"", "d2": "24\"", "sk": "CI-CFT-3624", "br": 3},
{"f": "Tee HD B", "d1": "36\"", "d2": "30\"", "sk": "CI-CFT-3630", "br": 3},
{"f": "Tee HD B", "d1": "36\"", "d2": "36\"", "sk": "CI-CFT-3636", "br": 3}
]

const TAPA: Record<string,string> = {"2\"": "CI-BCF-2", "2½\"": "CI-BCF-2.5", "3\"": "CI-BCF-3", "4\"": "CI-BCF-4", "6\"": "CI-BCF-6", "8\"": "CI-BCF-8", "10\"": "CI-BCF-10", "12\"": "CI-BCF-12", "14\"": "CI-BCF-14", "16\"": "CI-BCF-16", "18\"": "CI-BCF-18", "20\"": "CI-BCF-20", "24\"": "CI-BCF-24", "30\"": "CI-BCF-30", "36\"": "CI-BCF-36"}

const CDM: Record<string,string> = {
  '2"':"CI-CDM-2",'2½"':"CI-CDM-2.5",'3"':"CI-CDM-3",'4"':"CI-CDM-4",
  '6"':"CI-CDM-6",'8"':"CI-CDM-8",'10"':"CI-CDM-10",'12"':"CI-CDM-12",
  '14"':"CI-CDM-14",'16"':"CI-CDM-16",'18"':"CI-CDM-18",'20"':"CI-CDM-20",'24"':"CI-CDM-24"
}

// ═══ MAPAS ═══════════════════════════════════════════════════
const MAT_MAP: Record<string,string> = {
  'PVC — AWWA C900/C905':'PVC AWWA C900','PVC — Métrico ISO 4422':'PVC Métrico',
  'PVC — Ingles ASTM D2241':'PVC Inglés','HDPE — AWWA C906':'PEAD',
  'Hierro dúctil':'HD AWWA','Acero nuevo':'Acero','Acero (10+ años)':'Acero',
  'Asbesto cemento':'Asbesto A7'
}
const DN_MM: Record<number,string> = {
  50:'2"',75:'3"',100:'4"',150:'6"',200:'8"',
  250:'10"',300:'12"',350:'14"',400:'16"',
  450:'18"',500:'20"',600:'24"',750:'30"',900:'36"'
}

// ═══ Le/D (Crane TP-410 / AWWA) ═════════════════════════════
const LE_D: Record<string,number> = {
  'codo-90':30,'codo-45':16,'codo-22':8,'codo-11':4,
  'tee-directo':20,'tee-lateral':60,'reduccion':10,
  'vcg-r':13,'vcg-b':13,'vmb-c':45,'vmb-dex':35,'vmb-w':45,
  'check':150,'duo-check':100,'tapa-ciega':0,'cople':5
}

// ═══ VÁLVULAS ═══════════════════════════════════════════════
const VALV: Record<string,Record<string,string>> = {
  'vcg-r':{'2"':"VI-VFF-2",'2½"':"VI-VFF-25",'3"':"VI-VFF-3",'4"':"VI-VFF-4",'6"':"VI-VFF-6",
    '8"':"VI-VFF-8",'10"':"VI-VFF-10",'12"':"VI-VFF-12",'14"':"VI-VFF-14",'16"':"VI-VFF-16",
    '18"':"VI-VFF-18",'20"':"VI-VFF-20",'24"':"VI-VFF-24",'30"':"VI-VFF-30",'36"':"VI-VFF-36"},
  'vcg-b':{'2"':"VI-VFB-2",'2½"':"VI-VFB-25",'3"':"VI-VFB-3",'4"':"VI-VFB-4",'6"':"VI-VFB-6",
    '8"':"VI-VFB-8",'10"':"VI-VFB-10",'12"':"VI-VFB-12",'14"':"VI-VFB-14",'16"':"VI-VFB-16",
    '18"':"VI-VFB-18",'20"':"VI-VFB-20",'24"':"VI-VFB-24"},
  'vmb-c':{'3"':"VI-VMC-3250",'4"':"VI-VMC-4250",'6"':"VI-VMC-6250",'8"':"VI-VMC-8250",
    '10"':"VI-VMC-10250",'12"':"VI-VMC-12250",'14"':"VI-VMC-14250",'16"':"VI-VMC-16250",
    '18"':"VI-VMC-18250",'20"':"VI-VMC-20250",'24"':"VI-VMC-24250"},
  'vmb-dex':{'30"':"VI-VMC-30150",'36"':"VI-VMC-36150"},
  'vmb-w':{'2"':"VI-VMW-2",'2½"':"VI-VMW-25",'3"':"VI-VMW-3",'4"':"VI-VMW-4",
    '6"':"VI-VMW-6",'8"':"VI-VMW-8",'10"':"VI-VMW-10",'12"':"VI-VMW-12"},
}
const VALV_NORMA: Record<string,string> = {
  'vcg-r':'AWWA C515','vcg-b':'AWWA C500','vmb-c':'AWWA C504','vmb-dex':'AWWA C504','vmb-w':'ISO 5752'
}
const VALV_LABEL: Record<string,string> = {
  'vcg-r':'Comp. Resilente C515','vcg-b':'Comp. Bronce C500',
  'vmb-c':'Mariposa C504','vmb-dex':'Mariposa D.Exc.','vmb-w':'Mariposa Wafer'
}
const VALV_RANGO: Record<string,string> = {
  'vcg-r':'2"-36" · 250 PSI','vcg-b':'2"-24" · 250 PSI',
  'vmb-c':'3"-24" · 250 PSI','vmb-dex':'30"-36" · 150 PSI','vmb-w':'2"-12" · 150 PSI'
}

// ═══ HELPERS ════════════════════════════════════════════════
function findConn(fam:string, d1:string, d2:string) {
  return CONN.find(c => c.f.toLowerCase().includes(fam.toLowerCase()) && c.d1===d1 && c.d2===d2)
}
const DN_ORDER = ['2"','2½"','3"','4"','6"','8"','10"','12"','14"','16"','18"','20"','24"','30"','36"']

// ═══ TIPOS ══════════════════════════════════════════════════
interface Acc {
  id:number; label:string; sku:string; dn:string; dn2?:string
  bridas:number; leKey:string; norma:string
  isWafer?:boolean; isObra?:boolean; qty:number
}

interface Props {
  dnMM?: number
  dnStr?: string
  materialRaw?: string
  hf?: number
  velocidad?: number
  longitud?: number
  onHmChange?: (hm:number) => void
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ListaMaterialesSIMEX({
  dnMM, dnStr, materialRaw, hf, longitud, onHmChange
}: Props) {

  // Resolver DN — acepta número en mm O string con comillas
  let dn = ''
  if (dnStr) {
    dn = dnStr
  } else if (dnMM) {
    dn = DN_MM[dnMM] ?? ''
    if (!dn) {
      const fallbacks: Record<number,string> = {
        50:'2"',63:'2"',75:'3"',100:'4"',150:'6"',200:'8"',
        250:'10"',300:'12"',350:'14"',400:'16"',450:'18"',
        500:'20"',600:'24"',750:'30"',900:'36"'
      }
      dn = fallbacks[dnMM] ?? fallbacks[Math.round(dnMM/25)*25] ?? ''
    }
  }

  // Resolver material — mapear desde el string del selector
  const matCat = materialRaw ? (MAT_MAP[materialRaw] ?? materialRaw) : ''

  const kitKey = `${dn}|${matCat}`
  const kitData = KIT[kitKey] ?? null
  const esAcero = matCat === 'Acero'

  // Debug temporal — quitar después de verificar
  if (typeof window !== 'undefined') {
    console.log('[SIMEX DEBUG]', { dnMM, dn, matCat, kitKey, kitDataExists: !!kitData })
  }

  const [accs,         setAccs]         = useState<Acc[]>([])
  const [opcion,       setOpcion]       = useState<'A'|'B'>('A')
  const [visible,      setVisible]      = useState(true)
  const [sub,          setSub]          = useState<string|null>(null)
  const [bifTipo,      setBifTipo]      = useState<string|null>(null)
  const [redTipo,      setRedTipo]      = useState<string|null>(null)
  const [aceroTipo,    setAceroTipo]    = useState<'bridado'|'roscado'|'soldado'>('bridado')
  const [sugEnterrada, setSugEnterrada] = useState(false)

  const needsKit = !esAcero || aceroTipo === 'bridado'
  const D_m = (dnMM ?? 0) / 1000
  const L_m = longitud ?? 1000

  const DNS_MENORES = DN_ORDER.filter(d => DN_ORDER.indexOf(d) < DN_ORDER.indexOf(dn))

  // ── hm ──────────────────────────────────────────────────────
  const detalleHm = accs.filter(a=>!a.isObra).map(a=>{
    const leD = LE_D[a.leKey] ?? 0
    const Le  = leD * D_m * a.qty
    const dH  = hf && L_m ? (hf/L_m)*Le : 0
    return { label:a.label, leD, Le:+Le.toFixed(2), dH:+dH.toFixed(3) }
  }).filter(d=>d.leD>0)
  const sumaLe = detalleHm.reduce((s,d)=>s+d.Le,0)
  const hmReal = hf && L_m ? +(hf/L_m*sumaLe).toFixed(3) : +(hf??0)*0.1

  // ── agregar / eliminar ───────────────────────────────────────
  function add(a: Omit<Acc,'id'>) {
    setAccs(p=>[...p,{...a,id:Date.now()}])
    setSub(null); setBifTipo(null); setRedTipo(null)
    onHmChange?.(hmReal)
  }
  function del(id:number) { setAccs(p=>p.filter(a=>a.id!==id)) }
  function clear() { if(confirm('¿Limpiar todos los accesorios?')){ setAccs([]); setSugEnterrada(false) } }

  // ── handlers ─────────────────────────────────────────────────
  function addCodo(ang:string) {
    const c = findConn('Codo',dn,ang+'°')
    add({ label:`Codo ${dn}×${ang}°`, sku:c?.sk??`CI-CFB-${dn.replace('"','').replace('½','.5')}${ang}`,
      dn, bridas:2, leKey:`codo-${ang}`, norma:'AWWA C110', qty:1 })
  }
  function addBif(tipo:'tee'|'cruz', igual:boolean, dn2?:string) {
    const d2=igual?dn:(dn2??dn)
    const c=findConn(tipo==='tee'?'Tee':'Cruz',dn,d2)
    add({ label:`${tipo==='tee'?'Tee':'Cruz'} ${dn}${igual?'':'×'+d2}`,
      sku:c?.sk??'← CONF', dn, dn2:d2, bridas:tipo==='tee'?3:4,
      leKey:'tee-lateral', norma:'AWWA C110', qty:1 })
  }
  function addValv(tipo:string) {
    const sku=VALV[tipo]?.[dn]; if(!sku) return
    const isWafer=tipo==='vmb-w'
    add({ label:`${VALV_LABEL[tipo]??tipo} ${dn}`, sku, dn,
      bridas:isWafer?0:2, leKey:tipo, norma:VALV_NORMA[tipo]??'AWWA', isWafer, qty:1 })
    if(!isWafer) setSugEnterrada(true)
  }
  function addReduc(tipo:string, dn2:string) {
    if(tipo==='linea') {
      const c=findConn('Redu',dn,dn2)
      add({ label:`Reducción ${dn}×${dn2}`, sku:c?.sk??'← CONF',
        dn, dn2, bridas:2, leKey:'reduccion', norma:'AWWA C110', qty:1 })
    } else if(tipo==='deriv') {
      addBif('tee',false,dn2)
    } else {
      addBif('tee',true)
      const c=findConn('Redu',dn,dn2)
      setAccs(p=>[...p,{ id:Date.now()+1, label:`Reducción ${dn}×${dn2}`,
        sku:c?.sk??'← CONF', dn, dn2, bridas:2, leKey:'reduccion', norma:'AWWA C110', qty:1 }])
      setSub(null); setRedTipo(null)
    }
  }
  function addCheck(tipo:'check'|'duo-check') {
    const isWafer=tipo==='duo-check'
    add({ label:`${isWafer?'Duo Check Wafer':'Check Resilente C508'} ${dn}`,
      sku:'← CONF', dn, bridas:isWafer?0:2, leKey:tipo, norma:'AWWA C508', isWafer, qty:1 })
  }
  function addFin() {
    add({ label:`Tapa Ciega HD ${dn}`, sku:TAPA[dn]??'← CONF',
      dn, bridas:1, leKey:'tapa-ciega', norma:'AWWA C110', qty:1 })
  }
  function addCople() {
    add({ label:`Carrete de Desmontaje ${dn}`, sku:CDM[dn]??'← CONF',
      dn, bridas:2, leKey:'cople', norma:'AWWA', qty:1 })
  }
  function addMarco() {
    add({ label:'Marco con Tapa Dúctil 50×50cm', sku:'AI-MCT-D',
      dn, bridas:0, leKey:'tapa-ciega', norma:'EN-124 D400', isObra:true, qty:1 })
    setSugEnterrada(false)
  }

  // ── kit bridas ───────────────────────────────────────────────
  const totalBridas = accs.filter(a=>!a.isWafer&&!a.isObra).reduce((s,a)=>s+a.bridas*a.qty,0)
  const kitItems: Array<{sku:string,desc:string,qty:number,norma:string}> = []
  if(kitData && needsKit) {
    const extOD = kitData.eo ?? kitData.od ?? ''
    const gibOD = kitData.g?.replace('JN-JGI-','') ?? ''
    if(opcion==='A' && kitData.a) {
      kitItems.push({sku:kitData.a, desc:`Adaptador Bridado Universal ${dn}`, qty:totalBridas, norma:'EN 14525'})
    } else if(kitData.e) {
      kitItems.push({sku:kitData.e, desc:`Extremidad Bridada ${dn} (OD ${extOD}mm)`, qty:totalBridas, norma:'AWWA C110'})
      if(kitData.g) kitItems.push({sku:kitData.g, desc:`Junta Gibault ${gibOD}mm`, qty:totalBridas, norma:'AWWA'})
    }
    if(kitData.em) kitItems.push({sku:kitData.em, desc:`Empaque DN ${dn}`, qty:totalBridas, norma:'—'})
    if(kitData.t)  kitItems.push({sku:kitData.t,  desc:`Tornillo DN ${dn}`, qty:totalBridas*(kitData.b??8), norma:'—'})
  }

  const piezasPrinc = accs.filter(a=>!a.isObra)
  const piezasObra  = accs.filter(a=>a.isObra)
  const noABU       = !kitData?.a && !!kitData

  if(!dn) return null

  // ── estilos ──────────────────────────────────────────────────
  const C = {
    card:  { border:'1px solid var(--color-border-tertiary)', borderRadius:8, overflow:'hidden' as const },
    hdr:   { background:'var(--color-background-secondary)', padding:'5px 12px', fontSize:10,
             fontWeight:500 as const, color:'var(--color-text-secondary)',
             textTransform:'uppercase' as const, letterSpacing:'.06em' },
    row:   { display:'flex', alignItems:'center', gap:10, padding:'7px 12px',
             borderBottom:'1px solid var(--color-border-tertiary)' },
    rowKit:{ display:'flex', alignItems:'center', gap:10, padding:'6px 12px',
             borderBottom:'1px solid var(--color-border-tertiary)',
             background:'var(--color-background-secondary)' },
    btn:   { padding:'6px 12px', borderRadius:6, border:'1px solid var(--color-border-secondary)',
             background:'var(--color-background-primary)', cursor:'pointer', fontSize:12 },
    btnOn: { padding:'6px 12px', borderRadius:6, border:'2px solid var(--color-border-info)',
             background:'var(--color-background-info)', cursor:'pointer', fontSize:12, fontWeight:500 as const },
    sku:   { fontFamily:'monospace', fontSize:12, color:'var(--color-text-info)', flexShrink:0 },
    chip:  { display:'inline-flex', alignItems:'center', gap:4, background:'var(--color-background-secondary)',
             border:'1px solid var(--color-border-tertiary)', borderRadius:6, padding:'3px 8px', fontSize:11 },
    box:   { padding:'10px 12px', background:'var(--color-background-secondary)', borderRadius:8, marginBottom:10 },
    lbl:   { fontSize:12, fontWeight:500 as const, marginBottom:8, margin:0 },
  }

  return (
    <div style={{marginTop:'1.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--color-border-tertiary)'}}>

      {/* ENCABEZADO */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div>
          <h3 style={{fontSize:15,fontWeight:500,margin:0}}>Accesorios del tramo</h3>
          <p style={{fontSize:11,color:'var(--color-text-secondary)',margin:'3px 0 0'}}>
            {accs.length===0
              ? 'Agrega accesorios para calcular hm real y generar la lista de materiales SIMEX'
              : `${accs.length} accesorio(s) · hm = ${hmReal} m · ΣLe = ${sumaLe.toFixed(1)} m equiv.`}
          </p>
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          {accs.length>0 && <button style={C.btn} onClick={clear}>Limpiar ×</button>}
          <button style={C.btn} onClick={()=>setVisible(v=>!v)}>
            {visible?'Ocultar ◌':'Mostrar ○'}
          </button>
        </div>
      </div>

      {/* SELECTOR ACERO */}
      {esAcero && (
        <div style={C.box}>
          <p style={{...C.lbl,marginBottom:8}}>Tipo de conexión — tubería de acero:</p>
          <div style={{display:'flex',gap:8}}>
            {(['bridado','roscado','soldado'] as const).map(t=>(
              <button key={t} style={aceroTipo===t?C.btnOn:C.btn} onClick={()=>setAceroTipo(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          {aceroTipo==='roscado' && (
            <p style={{fontSize:11,color:'var(--color-text-warning)',marginTop:6}}>
              ⚠ Solo recomendado en DN ≤ 4". Sin kit de brida SIMEX.
            </p>
          )}
          {aceroTipo==='soldado' && (
            <p style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:6}}>
              Soldadura directa — sin ABU ni extremidades. Válvulas bridadas requieren bridas de transición.
            </p>
          )}
        </div>
      )}

      {/* BOTONES FUNCIÓN */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
        {[
          {k:'codo',   i:'↩',  l:'Cambio dirección', s:'Codo 11°–90°'},
          {k:'bifurc', i:'⑂',  l:'Bifurcación',       s:'Tee o Cruz'},
          {k:'secc',   i:'⊕',  l:'Seccionamiento',    s:'5 tipos válvula'},
          {k:'reducc', i:'▷',  l:'Reducción',          s:'Cambio de DN'},
          {k:'check',  i:'→|', l:'Antiretorno',        s:'Check / Duo Check'},
          {k:'fin',    i:'◉',  l:'Fin de línea',       s:`Tapa Ciega ${dn}`},
        ].map(b=>(
          <button key={b.k} onClick={()=>setSub(x=>x===b.k?null:b.k)}
            style={{padding:'11px 8px',borderRadius:8,cursor:'pointer',textAlign:'center',
              border:sub===b.k?'2px solid var(--color-border-info)':'1px solid var(--color-border-secondary)',
              background:sub===b.k?'var(--color-background-info)':'var(--color-background-primary)'}}>
            <div style={{fontSize:18,marginBottom:3}}>{b.i}</div>
            <div style={{fontSize:11,fontWeight:500}}>{b.l}</div>
            <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>{b.s}</div>
          </button>
        ))}
      </div>

      {/* ACCESORIOS DE OBRA */}
      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
        <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>Accesorios de obra:</span>
        <button style={C.btn} onClick={addCople}>⚙ Carrete de desmontaje {dn}</button>
        <button style={C.btn} onClick={addMarco}>⬜ Marco con tapa AI-MCT-D</button>
      </div>

      {/* SUB — CODO */}
      {sub==='codo' && (
        <div style={C.box}>
          <p style={{...C.lbl,marginBottom:8}}>Ángulo del codo:</p>
          <div style={{display:'flex',gap:8}}>
            {['11°','22°','45°','90°'].map(a=>(
              <button key={a} style={{...C.btn,fontSize:13,fontWeight:500,padding:'8px 18px'}}
                onClick={()=>addCodo(a.replace('°',''))}>{a}</button>
            ))}
          </div>
        </div>
      )}

      {/* SUB — BIFURCACIÓN */}
      {sub==='bifurc' && (
        <div style={C.box}>
          <p style={{...C.lbl,marginBottom:8}}>Tipo de bifurcación:</p>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <button style={bifTipo==='tee'?C.btnOn:C.btn} onClick={()=>setBifTipo(t=>t==='tee'?null:'tee')}>
              Tee — 1 ramal (3 bridas)
            </button>
            <button style={bifTipo==='cruz'?C.btnOn:C.btn} onClick={()=>setBifTipo(t=>t==='cruz'?null:'cruz')}>
              Cruz — 2 ramales (4 bridas)
            </button>
          </div>
          {bifTipo && (
            <>
              <p style={{fontSize:11,marginBottom:6}}>¿El ramal es igual DN o reducido?</p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <button style={C.btn} onClick={()=>addBif(bifTipo as 'tee'|'cruz',true)}>
                  Igual {dn}
                </button>
                {DNS_MENORES.map(d=>(
                  <button key={d} style={C.btn} onClick={()=>addBif(bifTipo as 'tee'|'cruz',false,d)}>
                    Ramal {d}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB — SECCIONAMIENTO */}
      {sub==='secc' && (
        <div style={C.box}>
          <p style={{...C.lbl,marginBottom:8}}>Tipo de válvula de seccionamiento:</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {(['vcg-r','vcg-b','vmb-c','vmb-dex','vmb-w'] as const).map(tipo=>{
              const disp=!!VALV[tipo]?.[dn]
              return (
                <button key={tipo} disabled={!disp}
                  onClick={()=>disp&&addValv(tipo)}
                  style={{...C.btn,padding:'10px 8px',textAlign:'center',
                    opacity:disp?1:0.38,cursor:disp?'pointer':'not-allowed'}}>
                  <div style={{fontWeight:500,marginBottom:2}}>{VALV_LABEL[tipo]}</div>
                  <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>{VALV_NORMA[tipo]}</div>
                  <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>{VALV_RANGO[tipo]}</div>
                  {!disp && (
                    <div style={{fontSize:10,color:'var(--color-text-danger)',marginTop:3}}>
                      No disponible en {dn}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* SUB — REDUCCIÓN */}
      {sub==='reducc' && (
        <div style={C.box}>
          <p style={{...C.lbl,marginBottom:8}}>¿Cómo reduce este tramo?</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
            {[
              {k:'linea',   l:'En línea',            d:`La línea ${dn} cambia de DN`},
              {k:'deriv',   l:'Derivación reducida',  d:`Línea ${dn} sigue + ramal menor`},
              {k:'bifurca', l:'Bifurca igual + reduce',d:'Tee igual y luego reduce'},
            ].map(o=>(
              <button key={o.k} style={redTipo===o.k?C.btnOn:C.btn}
                onClick={()=>setRedTipo(r=>r===o.k?null:o.k)}>
                <div style={{fontWeight:500}}>{o.l}</div>
                <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>{o.d}</div>
              </button>
            ))}
          </div>
          {redTipo && (
            <>
              <p style={{fontSize:11,marginBottom:6}}>DN de reducción:</p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {DNS_MENORES.map(d=>(
                  <button key={d} style={C.btn} onClick={()=>addReduc(redTipo,d)}>{d}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB — CHECK */}
      {sub==='check' && (
        <div style={C.box}>
          <p style={{...C.lbl,marginBottom:8}}>Tipo de válvula check:</p>
          <div style={{display:'flex',gap:8}}>
            <button style={{...C.btn,padding:'10px 16px'}} onClick={()=>addCheck('check')}>
              <div style={{fontWeight:500}}>Check Resilente C508</div>
              <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>2"–16" · 250 PSI · con bridas</div>
            </button>
            <button style={{...C.btn,padding:'10px 16px'}} onClick={()=>addCheck('duo-check')}>
              <div style={{fontWeight:500}}>Duo Check Wafer</div>
              <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>2"–36" · 150 PSI · entre bridas ⚠</div>
            </button>
          </div>
        </div>
      )}

      {/* SUB — FIN LÍNEA */}
      {sub==='fin' && (
        <div style={C.box}>
          <button style={{...C.btn,padding:'8px 16px'}} onClick={addFin}>
            Agregar Tapa Ciega HD {dn} — {TAPA[dn]??'← confirmar SKU'}
          </button>
        </div>
      )}

      {/* CHIPS ACCESORIOS AGREGADOS */}
      {accs.length>0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
          {accs.map(a=>(
            <span key={a.id} style={C.chip}>
              {a.label} ×{a.qty}
              <button onClick={()=>del(a.id)}
                style={{background:'none',border:'none',cursor:'pointer',fontSize:13,padding:0,
                  color:'var(--color-text-secondary)'}}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* SUGERENCIA ENTERRADA */}
      {sugEnterrada && (
        <div onClick={addMarco}
          style={{padding:'8px 12px',background:'var(--color-background-warning)',borderRadius:6,
            marginBottom:10,fontSize:12,color:'var(--color-text-warning)',cursor:'pointer'}}>
          💡 ¿Esta válvula va enterrada? → Clic para agregar Marco con Tapa Dúctil AI-MCT-D
        </div>
      )}

      {/* LISTA DE MATERIALES */}
      {visible && (
        <div>
          {/* TOGGLE A / B */}
          {kitData && (
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>Kit de conexión:</span>
              <div style={{display:'flex',border:'1px solid var(--color-border-secondary)',
                borderRadius:6,overflow:'hidden'}}>
                <button onClick={()=>setOpcion('A')}
                  style={{padding:'4px 14px',fontSize:12,border:'none',cursor:'pointer',
                    background:opcion==='A'?'var(--color-text-primary)':'var(--color-background-primary)',
                    color:opcion==='A'?'var(--color-background-primary)':'var(--color-text-primary)'}}>
                  A — ABU
                </button>
                <button onClick={()=>!noABU&&setOpcion('B')} disabled={noABU}
                  style={{padding:'4px 14px',fontSize:12,border:'none',
                    cursor:noABU?'not-allowed':'pointer',opacity:noABU?0.38:1,
                    background:opcion==='B'?'var(--color-text-primary)':'var(--color-background-primary)',
                    color:opcion==='B'?'var(--color-background-primary)':'var(--color-text-primary)'}}>
                  B — Ext + Gibault
                </button>
              </div>
              {noABU && (
                <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>
                  Sin ABU para este material — usando solo Opción B
                </span>
              )}
            </div>
          )}

          {/* TABLA */}
          <div style={C.card}>

            {piezasPrinc.length>0 && (
              <>
                <div style={C.hdr}>Piezas principales</div>
                {piezasPrinc.map(a=>(
                  <div key={a.id} style={C.row}>
                    <span style={C.sku}>{a.sku}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:500}}>{a.label}</span>
                    <span style={{minWidth:28,textAlign:'center',fontWeight:500}}>×{a.qty}</span>
                    <span style={{fontSize:10,color:'var(--color-text-secondary)',
                      minWidth:75,textAlign:'right'}}>{a.norma}</span>
                    {a.isWafer && (
                      <span style={{fontSize:10,color:'var(--color-text-warning)'}}>⚠ wafer</span>
                    )}
                  </div>
                ))}
              </>
            )}

            {kitItems.length>0 && (
              <>
                <div style={C.hdr}>
                  Kit de conexión — {opcion==='A'?'Adaptador Bridado Universal':'Extremidad + Gibault'}
                  {totalBridas>0?` · ${totalBridas} bridas totales`:' · (agregar accesorios para calcular cantidad)'}
                </div>
                {kitItems.map((k,i)=>(
                  <div key={i} style={C.rowKit}>
                    <span style={C.sku}>{k.sku}</span>
                    <span style={{flex:1,fontSize:12,color:'var(--color-text-secondary)'}}>{k.desc}</span>
                    <span style={{minWidth:28,textAlign:'center',fontSize:12,fontWeight:500}}>
                      {k.qty===0?'×?':`×${k.qty}`}
                    </span>
                    <span style={{fontSize:10,color:'var(--color-text-secondary)',
                      minWidth:75,textAlign:'right'}}>{k.norma}</span>
                  </div>
                ))}
              </>
            )}

            {piezasObra.length>0 && (
              <>
                <div style={C.hdr}>Accesorios de obra</div>
                {piezasObra.map(a=>(
                  <div key={a.id} style={{...C.row,background:'var(--color-background-info)',opacity:.9}}>
                    <span style={C.sku}>{a.sku}</span>
                    <span style={{flex:1,fontSize:12}}>{a.label}</span>
                    <span style={{minWidth:28,textAlign:'center',fontWeight:500}}>×{a.qty}</span>
                    <span style={{fontSize:10,color:'var(--color-text-secondary)',
                      minWidth:75,textAlign:'right'}}>{a.norma}</span>
                  </div>
                ))}
              </>
            )}

            {/* TABLA PÉRDIDAS HIDRÁULICAS */}
            {detalleHm.length>0 && (
              <>
                <div style={C.hdr}>Pérdidas por accesorio — Crane TP-410 / AWWA</div>
                <div style={{padding:'8px 12px'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid var(--color-border-tertiary)'}}>
                        {['Accesorio','Le/D','Le (m)','ΔhF (m)'].map(h=>(
                          <th key={h} style={{textAlign:h==='Accesorio'?'left':'center',
                            padding:'4px 6px',fontSize:10,fontWeight:500,
                            color:'var(--color-text-secondary)'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalleHm.map((d,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid var(--color-border-tertiary)'}}>
                          <td style={{padding:'4px 6px'}}>{d.label}</td>
                          <td style={{padding:'4px 6px',textAlign:'center',
                            color:'var(--color-text-secondary)'}}>{d.leD}</td>
                          <td style={{padding:'4px 6px',textAlign:'center',
                            fontFamily:'monospace'}}>{d.Le.toFixed(2)}</td>
                          <td style={{padding:'4px 6px',textAlign:'center',
                            fontFamily:'monospace',color:'var(--color-text-danger)'}}>{d.dH.toFixed(3)}</td>
                        </tr>
                      ))}
                      <tr style={{borderTop:'2px solid var(--color-border-secondary)',fontWeight:500}}>
                        <td style={{padding:'5px 6px'}}>TOTAL</td>
                        <td/>
                        <td style={{padding:'5px 6px',textAlign:'center',
                          fontFamily:'monospace'}}>{sumaLe.toFixed(2)}</td>
                        <td style={{padding:'5px 6px',textAlign:'center',
                          fontFamily:'monospace',color:'var(--color-text-danger)'}}>{hmReal}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:4}}>
                    {'hm = J × ΣLe · J = hf/L = '}
                    {hf&&L_m?(hf/L_m).toFixed(4):'—'}
                    {' m/m · Le = (Le/D) × D(m) × cant.'}
                  </p>
                </div>
              </>
            )}

            {accs.length===0 && (
              <div style={{padding:'2rem',textAlign:'center',
                color:'var(--color-text-secondary)',fontSize:13}}>
                Agrega accesorios para ver la lista de materiales SIMEX
              </div>
            )}
          </div>

          {/* BOTONES */}
          <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
            <button
              onClick={()=>window.print()}
              style={{padding:'8px 16px',borderRadius:6,border:'none',cursor:'pointer',fontWeight:500,
                background:'var(--color-text-primary)',color:'var(--color-background-primary)',fontSize:13}}>
              Generar PDF para distribuidor
            </button>
            <button style={C.btn} onClick={()=>{
              const lines=['SKU\tDescripción\tCantidad\tNorma']
              piezasPrinc.forEach(a=>lines.push(`${a.sku}\t${a.label}\t${a.qty}\t${a.norma}`))
              kitItems.forEach(k=>lines.push(`${k.sku}\t${k.desc}\t${k.qty||'?'}\t${k.norma}`))
              piezasObra.forEach(a=>lines.push(`${a.sku}\t${a.label}\t${a.qty}\t${a.norma}`))
              navigator.clipboard.writeText(lines.join('\n')).then(()=>alert('Lista copiada'))
            }}>Copiar SKUs</button>
          </div>

          <p style={{fontSize:10,color:'var(--color-text-secondary)',marginTop:8,paddingTop:8,
            borderTop:'1px solid var(--color-border-tertiary)'}}>
            ℹ Para hidrantes, collarines de toma y medidores, consultar con tu distribuidor SIMEX. ·
            GDL 33 3145-2626 · CDMX 55 2124-0024 · MTY 818 3377-4448 · MÉR 999 983-6089 · simexco.com.mx
          </p>
        </div>
      )}
    </div>
  )
}
