import XLSX from "xlsx";
import React from "react";
import Table from "./Table";
import { Tab } from "@headlessui/react";

function SheetJSApp() {
  const [data, setData] = React.useState([]);
  const [cols, setCols] = React.useState([]);
  const [sheetNames, setSheetNames] = React.useState([]);

  const handleFile = (file) => {
    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString;
    reader.onload = (e) => {
      /* Parse data */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: rABS ? "binary" : "array" });
      displayWorkbook(wb);
    };
    if (rABS) reader.readAsBinaryString(file);
    else reader.readAsArrayBuffer(file);
  };

  const handleUrl = (url) => {
    let oReq = new XMLHttpRequest();
    oReq.open("GET", url, true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function (e) {
      let arraybuffer = oReq.response;
      /*             not responseText!!              */

      /* convert data to binary string */
      let data = new Uint8Array(arraybuffer);
      let arr = new Array();
      for (let i = 0; i != data.length; ++i)
        arr[i] = String.fromCharCode(data[i]);
      let bstr = arr.join("");
      /* Call XLSX */
      let workbook = XLSX.read(bstr, { type: "binary" });
      displayWorkbook(workbook);
    };

    oReq.send();
  };

  const displayWorkbook = (wb) => {
    const data = Object.keys(wb.Sheets).map((sheetName) =>
      XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 })
    );
    /* Update state */
    setData(data);
    setSheetNames(wb.SheetNames);
    setCols(
      wb.SheetNames.map((sheetName) => make_cols(wb.Sheets[sheetName]["!ref"]))
    );
  };

  return (
    <div>
      <DragDropFile handleFile={handleFile}>
        <h2>Drag or choose a spreadsheet file</h2>
        <div className="">
          <DataInput handleFile={handleFile} />
        </div>
      </DragDropFile>
      <div className="mb-6">
        <h3>Enter spreadsheet URL</h3>
        <UrlInput handleUrl={handleUrl} />
      </div>
      <div className="row">
        {sheetNames.length > 1 && (
          <Tab.Group>
            <Tab.List>
              <div className="grid grid-cols-3 border">
                {sheetNames.map((sheetName) => (
                  <Tab className="border">
                    <span className="text-xs">{sheetName}</span>
                  </Tab>
                ))}
              </div>
            </Tab.List>
            <Tab.Panels>
              {data.map((data, index) => (
                <Tab.Panel>
                  <OutTable data={data} cols={cols[index]} />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        )}
        {sheetNames.length === 1 && <OutTable data={data[0]} cols={cols[0]} />}
      </div>
    </div>
  );
}

if (typeof module !== "undefined") module.exports = SheetJSApp;

/* -------------------------------------------------------------------------- */

/*
  Simple HTML5 file drag-and-drop wrapper
  usage: <DragDropFile handleFile={handleFile}>...</DragDropFile>
    handleFile(file:File):void;
*/

function DragDropFile({ handleFile, children }) {
  const suppress = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };

  return (
    <div onDrop={handleDrop} onDragEnter={suppress} onDragOver={suppress}>
      {children}
    </div>
  );
}

function UrlInput({ handleUrl }) {
  const handleChange = (e) => {
    const url = e.target.value;
    if (url) handleUrl(url);
  };

  return (
    <form className="form-inline">
      <div className="form-group">
        <label htmlFor="url">Spreadsheet URL (with CORS enabled!)</label>
        <br />
        <small>
          Here is one:
          http://localhost:3000/_files/eight-centuries-of-global-real-interest-rates-r-g-and-the-suprasecular-decline-1311-2018-data.xlsx
        </small>
        <br />
        <input
          type="text"
          id="url"
          className="border w-96"
          accept={SheetJSFT}
          onChange={handleChange}
        />
      </div>
    </form>
  );
}

/*
  Simple HTML5 file input wrapper
  usage: <DataInput handleFile={callback} />
    handleFile(file:File):void;
*/

function DataInput({ handleFile }) {
  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) handleFile(files[0]);
  };

  return (
    <form className="form-inline">
      <div className="form-group">
        <label htmlFor="file">Select spreadsheet file</label>
        <br />
        <input
          type="file"
          className="form-control"
          id="file"
          accept={SheetJSFT}
          onChange={handleChange}
        />
      </div>
    </form>
  );
}

/*
  Simple HTML Table
  usage: <OutTable data={data} cols={cols} />
    data:Array<Array<any> >;
    cols:Array<{name:string, key:number|string}>;
*/
function OutTable({ data, cols }) {
  return (
    <>
      {data && cols && (
        <div className="mt-[-1.85em] table-responsive overflow-x-auto">
          <table className="table table-striped">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th className="border" key={c.key}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td className="border" key={c.key}>
                      {r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* list of supported file types */
const SheetJSFT = [
  "xlsx",
  "xlsb",
  "xlsm",
  "xls",
  "xml",
  "csv",
  "txt",
  "ods",
  "fods",
  "uos",
  "sylk",
  "dif",
  "dbf",
  "prn",
  "qpw",
  "123",
  "wb*",
  "wq*",
  "html",
  "htm",
]
  .map((x) => `.${x}`)
  .join(",");

/* generate an array of column objects */
const make_cols = (refstr) => {
  let o = [],
    C = XLSX.utils.decode_range(refstr).e.c + 1;
  for (var i = 0; i < C; ++i) o[i] = { name: XLSX.utils.encode_col(i), key: i };
  return o;
};
