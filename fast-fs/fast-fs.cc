

#include <nan.h>
#include <uv.h>

using namespace v8;

struct RequestWithCallback
{
    uv_fs_t request;
    Nan::Persistent<Function> callback;
};

void onLStat(uv_fs_t * aRequest);
int CodeFromRequest(uv_fs_t * aRequest);

void LStat(const Nan::FunctionCallbackInfo<v8::Value>& info)
{
    const char * path = *Nan::Utf8String(info[0]);
    RequestWithCallback * requestWithCallback = new RequestWithCallback();

    requestWithCallback->request.data = requestWithCallback;
    requestWithCallback->callback.Reset(Local<Function>::Cast(info[1]));

    uv_fs_lstat(uv_default_loop(), &requestWithCallback->request, path, onLStat);
}

void onLStat(uv_fs_t * aRequest)
{
    Nan::HandleScope scope;
    
    RequestWithCallback * requestWithCallback = static_cast<RequestWithCallback *>(aRequest->data);
    Local<Function> callback = Nan::New<Function>(requestWithCallback->callback);
    
    int rc = CodeFromRequest(aRequest);

    const unsigned argc = 1;
    v8::Local<v8::Value> argv[argc] = { Nan::New(rc) };
    Nan::MakeCallback(Nan::GetCurrentContext()->Global(), callback, argc, argv);
    
    uv_fs_req_cleanup(aRequest);
    
    delete requestWithCallback;
}

int CodeFromRequest(uv_fs_t * aRequest)
{
    if (aRequest->result != 0)
        return aRequest->result;

    const uv_stat_t * const s = static_cast<const uv_stat_t*>(aRequest->ptr);
    
    return !!(s->st_mode & S_IFDIR);
}


void Init(v8::Local<v8::Object> exports)
{
  exports->Set(Nan::New("lstat").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(LStat)->GetFunction());
}

NODE_MODULE(fast_fs, Init)
